"""Public widget chat + authed history. Why: domain allowlist + rate limit here."""
import time
import urllib.parse

from fastapi import APIRouter, Depends, Header, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import make_error
from app.core.tenant import get_current_tenant, get_current_user
from app.models import Bot, Conversation, Message, UsageEvent
from app.modules.chat import orchestrator as orch

router = APIRouter(tags=["chat"])

_hits: dict[str, list[float]] = {}  # in-memory sliding-window rate limiter
LIMIT, WINDOW = 30, 60.0


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str = Field(default="web-1", max_length=128)


def _rate_ok(key: str) -> bool:
    now = time.time()
    arr = [t for t in _hits.get(key, []) if now - t < WINDOW]
    if len(arr) >= LIMIT:
        _hits[key] = arr
        return False
    arr.append(now)
    _hits[key] = arr
    return True


def _domain_allowed(bot: Bot, request: Request) -> bool:
    """Allow when allowlist empty (dev) or Origin/Referer host matches."""
    if not bot.allowed_domains:
        return True
    origin = request.headers.get("origin") or request.headers.get("referer") or ""
    try:
        host = urllib.parse.urlparse(origin).hostname or ""
    except Exception:
        host = ""
    return any(host == d or host.endswith("." + d) for d in bot.allowed_domains)


@router.post("/bots/{public_key}/chat")
def widget_chat(public_key: str, body: ChatIn, request: Request, db: Session = Depends(get_db)):
    """Public endpoint: retrieve -> generate -> persist + meter."""
    bot = db.query(Bot).filter(Bot.public_key == public_key).first()
    if not bot:
        return make_error("not_found", "Unknown bot key", None, 404)
    if not _domain_allowed(bot, request):
        return make_error("domain_blocked", "Domain not allowed for this bot", None, 403)
    client = request.client.host if request.client else "anon"
    if not _rate_ok(f"{public_key}:{client}"):
        return make_error("rate_limited", "Too many requests, slow down", None, 429)

    conv = db.query(Conversation).filter(
        Conversation.bot_id == bot.id, Conversation.customer_ref == body.session_id).first()
    if not conv:
        conv = Conversation(tenant_id=bot.tenant_id, bot_id=bot.id, channel="widget", customer_ref=body.session_id)
        db.add(conv)
        db.flush()
    db.add(Message(conversation_id=conv.id, role="user", content=body.message))
    db.flush()

    out = orch.answer_turn(db, bot, body.message)
    db.add(Message(conversation_id=conv.id, role="assistant", content=out.answer,
                   sources=out.sources, tokens_in=out.tokens_in, tokens_out=out.tokens_out,
                   cost=out.cost, latency_ms=out.latency_ms, confidence=out.confidence))
    if out.handoff and conv.status == "open":
        conv.status = "handoff"
    db.add(UsageEvent(tenant_id=bot.tenant_id, type="message", qty=1))
    db.add(UsageEvent(tenant_id=bot.tenant_id, type="tokens", qty=out.tokens_in + out.tokens_out))
    db.commit()
    return {"answer": out.answer, "sources": out.sources, "confidence": out.confidence,
            "intent": out.intent, "lang": out.lang, "handoff": out.handoff,
            "handoff_reason": out.handoff_reason, "conversation_id": conv.id}


@router.get("/conversations")
def list_conversations(db: Session = Depends(get_db), user=Depends(get_current_user),
                       tenant_id: str = Depends(get_current_tenant)):
    """Recent conversations with last message (tenant-scoped)."""
    convs = db.query(Conversation).filter(Conversation.tenant_id == tenant_id).order_by(
        Conversation.created_at.desc()).limit(50).all()
    out = []
    for c in convs:
        last = db.query(Message).filter(Message.conversation_id == c.id).order_by(
            Message.created_at.desc()).first()
        out.append({"id": c.id, "bot_id": c.bot_id, "status": c.status,
                    "customer_ref": c.customer_ref, "last_message": last.content[:200] if last else ""})
    return {"conversations": out}


@router.get("/conversations/{conv_id}")
def get_conversation(conv_id: str, db: Session = Depends(get_db), user=Depends(get_current_user),
                     tenant_id: str = Depends(get_current_tenant)):
    """Full transcript for one conversation."""
    c = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.tenant_id == tenant_id).first()
    if not c:
        return make_error("not_found", "Conversation not found", None, 404)
    msgs = db.query(Message).filter(Message.conversation_id == c.id).order_by(Message.created_at).all()
    return {"id": c.id, "status": c.status,
            "messages": [{"role": m.role, "content": m.content, "sources": m.sources,
                           "confidence": m.confidence} for m in msgs]}


@router.post("/messages/{message_id}/feedback")
def feedback(message_id: str, body: dict, db: Session = Depends(get_db)):
    """Public CSAT rating on an assistant message (1-5)."""
    from app.models import Feedback

    rating = int(body.get("rating", 0))
    if rating < 1 or rating > 5:
        return make_error("invalid_rating", "rating must be 1-5", None, 400)
    m = db.query(Message).filter(Message.id == message_id).first()
    if not m:
        return make_error("not_found", "Message not found", None, 404)
    db.add(Feedback(message_id=message_id, rating=rating, comment=str(body.get("comment", ""))[:1000]))
    db.commit()
    return {"ok": True}
