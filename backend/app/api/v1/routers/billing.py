"""Billing stub: plans, trial, metering, limit enforcement. Why: PRD FR-09."""
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import make_error
from app.core.tenant import get_current_tenant, get_current_user
from app.models import Subscription, UsageEvent

router = APIRouter(tags=["billing"])

PLANS = {
    "trial": {"price": 0, "conversations": 100, "bots": 1, "seats": 1},
    "starter": {"price": 19, "conversations": 1000, "bots": 1, "seats": 1},
    "growth": {"price": 59, "conversations": 5000, "bots": 3, "seats": 5},
    "scale": {"price": 149, "conversations": 20000, "bots": 10, "seats": 15},
}


class PlanIn(BaseModel):
    plan_id: str


def usage_for(db: Session, tenant_id: str) -> int:
    """Count message events for this tenant."""
    n = db.query(func.sum(UsageEvent.qty)).filter(
        UsageEvent.tenant_id == tenant_id, UsageEvent.type == "message").scalar()
    return int(n or 0)


def limit_state(db: Session, tenant_id: str) -> dict:
    """Return usage vs plan quota with 80%/100% flags."""
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    plan_id = sub.plan_id if sub else "trial"
    quota = PLANS.get(plan_id, PLANS["trial"])["conversations"]
    used = usage_for(db, tenant_id)
    pct = (used / quota * 100) if quota else 100.0
    return {"plan_id": plan_id, "used": used, "quota": quota, "pct": round(pct, 1),
            "warn_80": pct >= 80, "blocked": pct >= 100}


@router.get("/billing/plans")
def plans():
    """List available plans."""
    return {"plans": PLANS}


@router.get("/billing/subscription")
def get_sub(db: Session = Depends(get_db), user=Depends(get_current_user),
            tenant_id: str = Depends(get_current_tenant)):
    """Current subscription + usage vs limits."""
    state = limit_state(db, tenant_id)
    return state


@router.post("/billing/subscribe")
def subscribe(body: PlanIn, db: Session = Depends(get_db), user=Depends(get_current_user),
              tenant_id: str = Depends(get_current_tenant)):
    """Change plan (stub: no payment provider in MVP)."""
    if body.plan_id not in PLANS:
        return make_error("bad_plan", f"Unknown plan: {body.plan_id}", list(PLANS), 400)
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    if not sub:
        sub = Subscription(tenant_id=tenant_id)
        db.add(sub)
    sub.plan_id = body.plan_id
    sub.status = "active"
    sub.period_end = datetime.utcnow().date().isoformat()
    db.commit()
    return {"ok": True, **limit_state(db, tenant_id)}
