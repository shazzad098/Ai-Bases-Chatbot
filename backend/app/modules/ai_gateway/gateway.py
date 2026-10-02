"""AI Gateway: single entry for LLM calls. Why: swap providers without touching features."""
from dataclasses import dataclass

import httpx

from app.core.config import settings


@dataclass
class GenResult:
    text: str
    tokens_in: int
    tokens_out: int
    cost: float
    provider: str


class BaseProvider:
    name = "base"

    def generate(self, system: str, context: str, question: str) -> GenResult:
        raise NotImplementedError


class MockProvider(BaseProvider):
    """Offline extractive QA: FAQ-aware answer first, sentence fallback second."""

    name = "mock"

    def generate(self, system: str, context: str, question: str) -> GenResult:
        if not context.strip():
            return GenResult("", est_tokens(system + question), 0, 0.0, "mock")
        from app.modules.knowledge import service as ks

        faq = ks.extract_faq_answer(question, context)
        if faq:
            return GenResult(faq, est_tokens(system + context + question), est_tokens(faq), 0.0, "mock")
        qwords = _words(question)
        best = ""
        best_score = 0
        for sent in context.replace("\n", " ").split("."):
            s = sent.strip()
            if not s:
                continue
            score = len(qwords & _words(s))
            if score > best_score:
                best_score = score
                best = s
        text = (best + ".") if best and best_score > 0 else ""
        return GenResult(text, est_tokens(system + context + question), est_tokens(text), 0.0, "mock")


class OpenAIProvider(BaseProvider):
    """OpenAI-compatible chat completions with timeout + graceful fallback."""

    name = "openai"

    def generate(self, system: str, context: str, question: str) -> GenResult:
        prompt = f"Context:\n{context}\n\nQuestion: {question}\nAnswer only from context. If unsure, reply EMPTY."
        try:
            with httpx.Client(timeout=20.0) as c:
                r = c.post(
                    f"{settings.OPENAI_BASE_URL}/chat/completions",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={
                        "model": settings.OPENAI_MODEL,
                        "messages": [
                            {"role": "system", "content": system},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.2,
                    },
                )
                r.raise_for_status()
                text = r.json()["choices"][0]["message"]["content"].strip()
                if text.strip().upper() == "EMPTY":
                    text = ""
                return GenResult(text, est_tokens(system + prompt), est_tokens(text), cost_of(text), "openai")
        except Exception:
            return MockProvider().generate(system, context, question)


def _words(s: str) -> set[str]:
    return {w.strip(".,!?;:()[]{}\"'").lower() for w in s.split() if len(w) > 2}


def est_tokens(s: str) -> int:
    """Rough token estimate (4 chars/token). Why: metering without a tokenizer dep."""
    return max(1, len(s) // 4)


def cost_of(text: str) -> float:
    """Placeholder per-token price for the default small model."""
    return round(est_tokens(text) * 0.0000006, 6)


class AIGateway:
    """Routes generation to the configured provider with mock fallback."""

    def __init__(self) -> None:
        self.mock = MockProvider()
        self.openai = OpenAIProvider()

    def route(self, system: str, context: str, question: str) -> GenResult:
        """Pick provider by config; fall back to mock on any failure/empty key."""
        if settings.AI_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            return self.openai.generate(system, context, question)
        if settings.OPENAI_API_KEY:
            out = self.openai.generate(system, context, question)
            if out.text:
                return out
            return out
        return self.mock.generate(system, context, question)


gateway = AIGateway()
