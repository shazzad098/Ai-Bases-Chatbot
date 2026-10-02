"""Agent inbox: list/assign/reply/close/notes. Why: handoff queue for humans."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import make_error
from app.core.tenant import get_current_tenant, get_current_user
from app.models import Conversation, Message

router = APIRouter(tags=["inbox"])


class ReplyIn(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class NoteIn(BaseModel):
    note: str = Field(max_length=2000)


@router.get("/inbox")
def inbox(status: str = "handoff", db: Session = Depends(get_db), user=Depends(get_current_user),
          tenant_id: str = Depends(get_current_tenant)):
    """List conversations needing attention (default: handoff queue)."""
    q = db.query(Conversation).filter(Conversation.tenant_id == tenant_id)
    if status != "all":
        q = q.filter(Conversation.status == status)
    rows = q.order_by(Conversation.created_at.desc()).limit(50).all()
    return {"conversations": [{"id": c.id, "bot_id": c.bot_id, "status": c.status,
                               "assigned": c.assigned_agent_id} for c in rows]}


@router.post("/inbox/{conv_id}/assign")
def assign(conv_id: str, db: Session = Depends(get_db), user=Depends(get_current_user),
           tenant_id: str = Depends(get_current_tenant)):
    """Assign conversation to the current agent."""
    c = _get(db, conv_id, tenant_id)
    if isinstance(c, dict):
        return c
    c.assigned_agent_id = user.id
    c.status = "assigned"
    db.commit()
    return {"ok": True, "assigned": user.id}


@router.post("/inbox/{conv_id}/reply")
def reply(conv_id: str, body: ReplyIn, db: Session = Depends(get_db), user=Depends(get_current_user),
          tenant_id: str = Depends(get_current_tenant)):
    """Agent reply inside a conversation (full context preserved)."""
    c = _get(db, conv_id, tenant_id)
    if isinstance(c, dict):
        return c
    db.add(Message(conversation_id=c.id, role="agent", content=body.content))
    c.status = "assigned"
    db.commit()
    return {"ok": True}


@router.post("/inbox/{conv_id}/close")
def close(conv_id: str, db: Session = Depends(get_db), user=Depends(get_current_user),
          tenant_id: str = Depends(get_current_tenant)):
    """Resolve/close a conversation."""
    c = _get(db, conv_id, tenant_id)
    if isinstance(c, dict):
        return c
    c.status = "closed"
    db.commit()
    return {"ok": True}


@router.post("/inbox/{conv_id}/notes")
def notes(conv_id: str, body: NoteIn, db: Session = Depends(get_db), user=Depends(get_current_user),
          tenant_id: str = Depends(get_current_tenant)):
    """Save an internal agent note."""
    c = _get(db, conv_id, tenant_id)
    if isinstance(c, dict):
        return c
    c.note = body.note
    db.commit()
    return {"ok": True}


def _get(db: Session, conv_id: str, tenant_id: str):
    c = db.query(Conversation).filter(Conversation.id == conv_id, Conversation.tenant_id == tenant_id).first()
    if not c:
        return make_error("not_found", "Conversation not found", None, 404)
    return c
