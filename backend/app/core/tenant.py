"""Tenant middleware + dependencies. Why: enforce tenant isolation."""
from fastapi import Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import decode_token


async def tenant_middleware(request: Request, call_next):
    """Copy X-Tenant-ID into request.state for logging/filtering."""
    request.state.tenant_id = request.headers.get("X-Tenant-ID", "")
    request.state.request_id = request.headers.get("X-Request-ID", "")
    return await call_next(request)


def get_tenant_id(x_tenant_id: str | None = Header(default=None, alias="X-Tenant-ID")) -> str:
    """Require the X-Tenant-ID header on authed routes."""
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail="X-Tenant-ID header required")
    return x_tenant_id


def get_current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    """Validate Bearer JWT and return the User row."""
    from app.models import User

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    try:
        payload = decode_token(authorization.removeprefix("Bearer ").strip())
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_current_tenant(
    user=Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    """Ensure the JWT tenant matches the header tenant (no cross-tenant access)."""
    if user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Tenant mismatch")
    return tenant_id
