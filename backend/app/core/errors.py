"""Typed error envelope + request_id. Why: consistent /v1 error shape."""
import uuid
from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse


def make_error(code: str, message: str, details: Any = None, status: int = 400) -> JSONResponse:
    """Build a `{code,message,details,request_id}` JSON error response."""
    return JSONResponse(
        status_code=status,
        content={"code": code, "message": message, "details": details, "request_id": uuid.uuid4().hex[:12]},
    )


async def unhandled_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler so 500s keep the typed envelope."""
    return make_error("internal_error", str(exc)[:300], None, 500)
