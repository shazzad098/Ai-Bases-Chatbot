"""Analytics KPIs: volume, resolution%, CSAT, top/unanswered. Why: PRD FR-10."""
from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.tenant import get_current_tenant, get_current_user
from app.models import Conversation, Feedback, Lead, Message

router = APIRouter(tags=["analytics"])

FALLBACK_HINTS = ("don't have that information", "আমার কাছে নেই")


@router.get("/analytics/overview")
def overview(db: Session = Depends(get_db), user=Depends(get_current_user),
             tenant_id: str = Depends(get_current_tenant)):
    """KPIs: conversations, resolution rate, CSAT, top questions, unanswered."""
    convs = db.query(Conversation).filter(Conversation.tenant_id == tenant_id).all()
    cids = [c.id for c in convs]
    msgs = db.query(Message).filter(Message.conversation_id.in_(cids)).all() if cids else []
    assistants = [m for m in msgs if m.role == "assistant"]
    users_q = [m.content for m in msgs if m.role == "user"]

    resolved = sum(1 for c in convs if c.status == "closed")
    resolution = round(resolved / len(convs) * 100, 1) if convs else 0.0

    ratings = [f.rating for f in db.query(Feedback).all()] if cids else []
    # scope feedback to tenant messages only
    mids = {m.id for m in assistants}
    ratings = [f.rating for f in db.query(Feedback).all() if f.message_id in mids]
    csat = round(sum(ratings) / len(ratings), 2) if ratings else 0.0

    top = Counter(users_q).most_common(5)
    unanswered = [m.content[:160] for m in assistants
                  if any(h in m.content for h in FALLBACK_HINTS)][:10]
    return {"conversations": len(convs), "messages": len(msgs), "resolution_rate": resolution,
            "csat": csat, "top_questions": [{"q": q, "count": n} for q, n in top],
            "unanswered": unanswered}


@router.get("/analytics/kpis")
def kpis(db: Session = Depends(get_db), user=Depends(get_current_user),
         tenant_id: str = Depends(get_current_tenant)):
    """Compact KPI cards for the dashboard Overview (same source as /overview)."""
    o = overview(db, user, tenant_id)
    leads = db.query(Lead).filter(Lead.tenant_id == tenant_id).count()
    return {"conversations": o["conversations"], "resolution": round(o["resolution_rate"] / 100, 3),
            "csat": o["csat"], "leads": leads}
