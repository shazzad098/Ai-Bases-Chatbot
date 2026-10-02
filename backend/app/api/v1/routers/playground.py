"""Playground: test chat with sources + confidence shown. Why: debug RAG fast."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import make_error
from app.core.tenant import get_current_tenant, get_current_user
from app.models import Bot
from app.modules.chat import orchestrator as orch

router = APIRouter(tags=["playground"])


class PlayIn(BaseModel):
    bot_id: str
    message: str = Field(min_length=1, max_length=4000)


@router.post("/playground/chat")
def play(body: PlayIn, db: Session = Depends(get_db), user=Depends(get_current_user),
         tenant_id: str = Depends(get_current_tenant)):
    """Run one orchestrated turn without persisting (shows sources/confidence/intent)."""
    bot = db.query(Bot).filter(Bot.id == body.bot_id, Bot.tenant_id == tenant_id).first()
    if not bot:
        return make_error("not_found", "Bot not found", None, 404)
    out = orch.answer_turn(db, bot, body.message)
    return {"answer": out.answer, "sources": out.sources, "confidence": out.confidence,
            "intent": out.intent, "lang": out.lang, "handoff": out.handoff,
            "handoff_reason": out.handoff_reason}
