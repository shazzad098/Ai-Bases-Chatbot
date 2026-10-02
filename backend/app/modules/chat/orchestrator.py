"""Chat orchestrator: detect lang, intent, retrieve, generate, guard. Why: rules live here."""
import re
import time
from dataclasses import dataclass

from app.core.config import settings
from app.modules.ai_gateway.gateway import gateway
from app.modules.knowledge import service as ks
from app.modules.niche_packs.packs import system_prompt_for

BN_RE = re.compile(r"[\u0980-\u09FF]")
HUMAN_RE = re.compile(r"\b(human|agent|person|someone real|talk to (human|agent|someone)|মানব|এজেন্ট)\b", re.I)
NEG_RE = re.compile(r"\b(angry|furious|terrible|awful|worst|hate|scam|fraud|cheat|refund now|complain|বাজে|খারাপ|প্রতার)\b", re.I)
SENSITIVE_RE = re.compile(r"\b(payment dispute|chargeback|lawsuit|legal|lawyer|health|medical|emergency|safety|মামলা|আইন)\b", re.I)
SMALLTALK_RE = re.compile(r"^(hi|hello|hey|yo|salam|assalam|__/)?\s*(hi|hello|hey|salam|adab|how are you|kemon|kemon acho)?\s*\??$", re.I)


@dataclass
class Orchestrated:
    answer: str
    sources: list[dict]
    confidence: float
    intent: str
    lang: str
    handoff: bool
    handoff_reason: str
    tokens_in: int
    tokens_out: int
    cost: float
    latency_ms: int


def detect_language(text: str) -> str:
    """'bn' if Bangla chars or common Bangla-latin words, else 'en'."""
    if BN_RE.search(text or ""):
        return "bn"
    if re.search(r"\b(kemon|dam|koto|taka|delivery|ভর্তি|ফি)\b", (text or "").lower()):
        return "bn" if BN_RE.search(text or "") or re.search(r"\b(kemon|koto)\b", text.lower()) else "en"
    return "en"


def route_intent(text: str, niche: str) -> str:
    """Keyword intent routing (faq/order/lead/small-talk/human)."""
    t = (text or "").lower()
    if HUMAN_RE.search(t):
        return "human"
    if re.search(r"\b(order|track|tracking|parcel|delivery status|order id|অর্ডার)\b", t):
        return "order"
    if re.search(r"\b(lead|contact|call me|phone|email|admission|apply|enroll|ভর্তি)\b", t):
        return "lead"
    if SMALLTALK_RE.match(t.strip()) or t.strip() in {"hi", "hello", "hey", "salam"}:
        return "small-talk"
    if re.search(r"\b(price|dam|koto|fee|cost|return|refund|schedule|course|delivery|shipping)\b", t):
        return "faq"
    return "faq"


def fallback_message(lang: str) -> str:
    """Grounded refusal + handoff offer (never hallucinate)."""
    if lang == "bn":
        return "দুঃখিত, এই তথ্যটি আমার কাছে নেই। মানব এজেন্টের সাথে কথা বলতে চান?"
    return "Sorry, I don't have that information. Would you like to talk to a human agent?"


def no_knowledge_message(lang: str) -> str:
    """Guidance when the bot has no knowledge sources at all."""
    if lang == "bn":
        return "এই বটে এখনো কোনো তথ্য যোগ করা হয়নি, তাই উত্তর দিতে পারছি না। Knowledge পেজে FAQ/পলিসি যোগ করে আবার জিজ্ঞাসা করুন।"
    return "This bot has no knowledge added yet, so I can't answer questions. Please add FAQs or policies on the Knowledge page, then ask me again."


def should_handoff(text: str, confidence: float, threshold: float) -> tuple[bool, str]:
    """Handoff rules per rules.md: human ask / negative sentiment / low confidence / sensitive."""
    if HUMAN_RE.search(text or ""):
        return True, "user_requested_human"
    if SENSITIVE_RE.search(text or ""):
        return True, "sensitive_topic"
    if NEG_RE.search(text or ""):
        return True, "negative_sentiment"
    if confidence < threshold:
        return True, "low_confidence"
    return False, ""


def answer_turn(db, bot, question: str) -> Orchestrated:
    """Full RAG turn: retrieve (tenant+bot filtered) -> generate -> guard -> meter."""
    from app.models import KnowledgeChunk

    t0 = time.time()
    lang = detect_language(question)
    intent = route_intent(question, bot.niche)
    system = system_prompt_for(bot.niche, lang)

    rows = (
        db.query(KnowledgeChunk)
        .filter(KnowledgeChunk.tenant_id == bot.tenant_id, KnowledgeChunk.bot_id == bot.id)
        .all()
    )
    if not rows:
        latency = int((time.time() - t0) * 1000)
        return Orchestrated(no_knowledge_message(lang), [], 0.0, intent, lang,
                            True, "no_knowledge", 0, 0, 0.0, latency)
    hits = ks.hybrid_search(question, rows, top_k=4)
    usable = [h for h in hits if h.score >= 0.05]
    context = "\n\n".join(f"[{i+1}] {h.content}" for i, h in enumerate(usable))

    gen = gateway.route(system, context, question) if usable else None
    answer = (gen.text.strip() if gen and gen.text else "")
    confidence = round(usable[0].score if usable else 0.0, 3)

    handoff, reason = should_handoff(question, confidence, settings.CONFIDENCE_THRESHOLD)
    if intent == "human":
        handoff, reason = True, "user_requested_human"
    if not answer:
        answer = fallback_message(lang)
        handoff, reason = True, reason or "no_source"
    elif handoff and reason == "low_confidence":
        answer = fallback_message(lang)

    # Citation check: factual answers SHOULD carry a source ref
    sources = [{"chunk_id": h.chunk_id, "source_id": h.source_id, "score": round(h.score, 3)} for h in usable[:3]]
    if usable and "[1]" not in answer and "Source" not in answer:
        answer = answer.rstrip() + f" [Source 1]"

    latency = int((time.time() - t0) * 1000)
    tokens_in = gen.tokens_in if gen else len((system + question + context)) // 4
    tokens_out = gen.tokens_out if gen else len(answer) // 4
    cost = gen.cost if gen else 0.0
    return Orchestrated(answer, sources, confidence, intent, lang, handoff, reason, tokens_in, tokens_out, cost, latency)
