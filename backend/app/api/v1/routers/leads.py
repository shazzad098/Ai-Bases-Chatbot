"""Leads: capture + list + CSV export. Why: niche-pack lead forms land here."""
import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import make_error
from app.core.tenant import get_current_tenant, get_current_user
from app.models import Lead

router = APIRouter(tags=["leads"])


class LeadIn(BaseModel):
    bot_id: str
    name: str = Field(default="", max_length=200)
    contact: str = Field(default="", max_length=255)
    payload: dict = Field(default_factory=dict)


class LeadUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    contact: str | None = Field(default=None, max_length=255)
    intent: str | None = Field(default=None, max_length=255)
    status: str | None = Field(default=None, max_length=64)


@router.post("/leads")
def create_lead(body: LeadIn, db: Session = Depends(get_db), user=Depends(get_current_user),
                tenant_id: str = Depends(get_current_tenant)):
    """Capture a lead (consent handled client-side per rules.md)."""
    lead = Lead(tenant_id=tenant_id, bot_id=body.bot_id, name=body.name,
                contact=body.contact, payload=body.payload)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return {"id": lead.id}


@router.get("/leads")
def list_leads(db: Session = Depends(get_db), user=Depends(get_current_user),
               tenant_id: str = Depends(get_current_tenant)):
    """List leads for this tenant."""
    rows = db.query(Lead).filter(Lead.tenant_id == tenant_id).order_by(Lead.created_at.desc()).limit(200).all()
    return {"leads": [{"id": l.id, "name": l.name, "contact": l.contact, "payload": l.payload} for l in rows]}


@router.put("/leads/{lead_id}")
def update_lead(lead_id: str, body: LeadUpdate, db: Session = Depends(get_db),
                user=Depends(get_current_user), tenant_id: str = Depends(get_current_tenant)):
    """Edit a lead's contact info, intent or status (tenant-scoped)."""
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.tenant_id == tenant_id).first()
    if not lead:
        return make_error("not_found", "Lead not found", None, 404)
    if body.name is not None:
        lead.name = body.name
    if body.contact is not None:
        lead.contact = body.contact
    payload = dict(lead.payload or {})
    if body.intent is not None:
        payload["intent"] = body.intent
    if body.status is not None:
        payload["status"] = body.status
    lead.payload = payload
    db.commit()
    db.refresh(lead)
    return {"id": lead.id, "name": lead.name, "contact": lead.contact, "payload": lead.payload}


@router.get("/leads/export", response_class=PlainTextResponse)
def export_leads(db: Session = Depends(get_db), user=Depends(get_current_user),
                 tenant_id: str = Depends(get_current_tenant)):
    """Export leads as CSV."""
    rows = db.query(Lead).filter(Lead.tenant_id == tenant_id).all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["id", "name", "contact", "payload"])
    for l in rows:
        w.writerow([l.id, l.name, l.contact, str(l.payload)])
    return buf.getvalue()
