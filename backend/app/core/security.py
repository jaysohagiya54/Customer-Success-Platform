import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.core.config import get_settings

ACCESS_TOKEN = "access"
REFRESH_TOKEN = "refresh"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def _create_token(subject: str, token_type: str, expires_delta: timedelta) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: str) -> str:
    settings = get_settings()
    return _create_token(user_id, ACCESS_TOKEN, timedelta(minutes=settings.access_token_expire_minutes))


def create_refresh_token(user_id: str) -> str:
    settings = get_settings()
    return _create_token(user_id, REFRESH_TOKEN, timedelta(days=settings.refresh_token_expire_days))


def decode_token(token: str, expected_type: str) -> dict[str, Any]:
    """Decode and validate a JWT. Raises jwt.InvalidTokenError on any failure."""
    settings = get_settings()
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError(f"Expected {expected_type} token")
    return payload


def token_remaining_seconds(payload: dict[str, Any]) -> int:
    """Return seconds until this token expires (>= 0)."""
    exp = payload.get("exp", 0)
    now = datetime.now(timezone.utc).timestamp()
    return max(0, int(exp - now))
