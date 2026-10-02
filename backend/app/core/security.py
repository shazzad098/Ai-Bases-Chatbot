"""JWT + password hashing + public-key gen. Why: auth isolated in one place."""
import secrets
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

_pwd = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")
ALGO = "HS256"


def hash_password(plain: str) -> str:
    """Hash a password (bcrypt preferred, pbkdf2 fallback)."""
    return _pwd.hash(plain[:72] if plain else "")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against its hash (tolerates bad hashes)."""
    try:
        return _pwd.verify(plain[:72] if plain else "", hashed)
    except Exception:
        return False


def create_token(sub: str, tenant_id: str, minutes: int | None = None) -> str:
    """Create a short-lived JWT carrying user id + tenant id."""
    exp = datetime.now(timezone.utc) + timedelta(
        minutes=minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode({"sub": sub, "tenant_id": tenant_id, "exp": exp}, settings.SECRET_KEY, algorithm=ALGO)


def decode_token(token: str) -> dict:
    """Decode/validate a JWT; raises on expiry or tampering."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGO])


def new_public_key() -> str:
    """Generate a bot widget public key (rotatable, non-secret)."""
    return "pk_" + secrets.token_urlsafe(24)
