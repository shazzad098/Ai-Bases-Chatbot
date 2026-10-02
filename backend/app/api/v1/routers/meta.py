"""Meta: provider/model discovery. Why: OpenAI-style /v1/models for tooling + dashboard."""
from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(tags=["meta"])


@router.get("/models")
def list_models():
    """List the AI provider + active models (OpenAI-compatible shape)."""
    provider = "openai" if settings.OPENAI_API_KEY else settings.AI_PROVIDER
    model = settings.OPENAI_MODEL if settings.OPENAI_API_KEY else "mock-extractive-v1"
    return {
        "object": "list",
        "provider": provider,
        "data": [{"id": model, "object": "model", "provider": provider}],
        "chat_model": model,
        "embedding": "local-hash-384",
    }
