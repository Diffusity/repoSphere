import base64
import json

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.config import CLERK_SECRET_KEY
from src.db.models.user import User

CLERK_API_BASE = "https://api.clerk.com/v1"


async def _clerk_get_user(clerk_user_id: str) -> dict | None:
    """Call Clerk REST API to fetch a user by their Clerk ID."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{CLERK_API_BASE}/users/{clerk_user_id}",
            headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
        )
        if resp.status_code == 200:
            return resp.json()
    return None


def decode_clerk_jwt_payload(token: str) -> dict | None:
    """Decode the JWT payload (no signature verification — Clerk handles that).
    Returns the payload dict or None."""
    try:
        parts = token.split(".")
        if len(parts) < 2:
            return None
        # JWT base64url → standard base64
        payload_b64 = parts[1] + "=" * (4 - len(parts[1]) % 4)
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        return json.loads(payload_bytes)
    except Exception:
        return None


async def get_user_from_token(token: str) -> dict | None:
    """Extract the Clerk user ID from a JWT and fetch the user from Clerk API."""
    payload = decode_clerk_jwt_payload(token)
    if not payload or "sub" not in payload:
        return None
    return await _clerk_get_user(payload["sub"])


async def sync_user_to_database(
    clerk_user_id: str, db: AsyncSession
) -> User | None:
    """Find or create a local User row matching the Clerk user."""
    result = await db.execute(select(User).where(User.clerk_id == clerk_user_id))
    user = result.scalar_one_or_none()

    if user:
        return user

    # User doesn't exist locally — fetch from Clerk and create
    clerk_data = await _clerk_get_user(clerk_user_id)
    if not clerk_data:
        return None

    email_obj = clerk_data.get("email_addresses", [{}])[0] if clerk_data.get("email_addresses") else {}
    email = email_obj.get("email_address", "")
    verified = email_obj.get("verification", {}).get("status") == "verified"

    new_user = User(
        clerk_id=clerk_data["id"],
        name=clerk_data.get("full_name") or clerk_data.get("first_name") or "User",
        email=email,
        provider="email" if verified else "google",
        image_url=clerk_data.get("image_url"),
        admin=False,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user
