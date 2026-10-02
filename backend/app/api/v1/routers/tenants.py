"""Workspaces (tenants). Why: thin CRUD, tenant scoping enforced."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.tenant import get_current_user
from app.models import Tenant

router = APIRouter(tags=["tenants"])


class TenantIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)


@router.post("/tenants")
def create_tenant(body: TenantIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Create an additional workspace."""
    t = Tenant(name=body.name)
    db.add(t)
    db.commit()
    db.refresh(t)
    return {"id": t.id, "name": t.name, "plan_id": t.plan_id}


@router.get("/tenants")
def list_tenants(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """List the caller's workspace (tenant-isolated)."""
    t = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    return {"tenants": [{"id": t.id, "name": t.name, "plan_id": t.plan_id}] if t else []}
