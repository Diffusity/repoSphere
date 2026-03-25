import jwt

from src.config.config import JWT_SECRET


def generate_token(payload: dict) -> str:
    """Sign a JWT with the server secret. No expiry (matches reference)."""
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict | None:
    """Verify and decode a JWT. Returns the payload or None."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
