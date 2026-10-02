"""Auth: signup, login, me. Why: JWT + tenant bootstrap in one place."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import make_error
from app.core.security import create_token, hash_password, verify_password
from app.core.tenant import get_current_user
from app.models import Subscription, Tenant, User

router = APIRouter(tags=["auth"])


class SignupIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    workspace: str = Field(min_length=2, max_length=200)
    niche: str = Field(default="ecommerce", max_length=64)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


@router.post("/auth/signup")
def signup(body: SignupIn, db: Session = Depends(get_db)):
    """Create workspace tenant + owner user + trial subscription."""
    if db.query(User).filter(User.email == body.email.lower()).first():
        return make_error("email_taken", "Email already registered", None, 409)
    tenant = Tenant(name=body.workspace)
    db.add(tenant)
    db.flush()
    user = User(tenant_id=tenant.id, email=body.email.lower(), password_hash=hash_password(body.password), role="owner")
    db.add(user)
    db.add(Subscription(tenant_id=tenant.id, plan_id="trial", status="active"))
    db.commit()
    token = create_token(user.id, tenant.id)
    return {"token": token, "tenant_id": tenant.id, "user": {"id": user.id, "email": user.email}}


@router.post("/auth/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    """Validate credentials and issue JWT."""
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        return make_error("invalid_credentials", "Invalid email or password", None, 401)
    return {"token": create_token(user.id, user.tenant_id), "tenant_id": user.tenant_id}


@router.get("/auth/me")
def me(user: User = Depends(get_current_user)):
    """Return current user profile."""
    return {"id": user.id, "email": user.email, "role": user.role, "tenant_id": user.tenant_id}
