from datetime import datetime, timedelta, timezone

import jwt

from src.config.config import JWT_EXPIRY_HOURS, JWT_SECRET


def generate_token(payload: dict) -> str:
    """Sign a JWT with the server secret."""
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def generate_auth_token(user_id: str, email: str) -> str:
    """Generate auth JWT with exp/sub claims for browser sessions."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=JWT_EXPIRY_HOURS)).timestamp()),
    }
    return generate_token(payload)


def decode_token(token: str) -> dict | None:
    """Verify and decode a JWT. Returns the payload or None."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
