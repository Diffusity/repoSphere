from fastapi import Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.db.database import get_db
from src.db.models.user import User
from src.db.models.session import TerminalSession
from src.services.clerk import decode_clerk_jwt_payload, sync_user_to_database
from src.services import jwt_service


async def auth_middleware(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency that authenticates via Clerk Bearer or Terminal JWT.
    Returns the authenticated User or raises 401."""

    auth_header = request.headers.get("authorization", "")
    parts = auth_header.split(" ", 1)
    if len(parts) != 2:
        raise HTTPException(status_code=401, detail="No authorization token provided")

    method, token = parts[0], parts[1]

    # --- Clerk Bearer token ---
    if method == "Bearer":
        payload = decode_clerk_jwt_payload(token)
        clerk_user_id = payload.get("sub") if payload else None

        if clerk_user_id:
            user = await sync_user_to_database(clerk_user_id, db)
            if not user:
                raise HTTPException(
                    status_code=500, detail="Failed to sync user to database"
                )
            return user

    # --- Terminal JWT ---
    elif method == "Terminal":
        decoded = jwt_service.decode_token(token)
        if decoded and decoded.get("email") and decoded.get("sessionId"):
            # 1. Verify session exists and is active
            session_id = decoded["sessionId"]
            session_result = await db.execute(
                select(TerminalSession).where(TerminalSession.id == session_id)
            )
            session = session_result.scalar_one_or_none()

            if not session or session.status != "active":
                raise HTTPException(status_code=401, detail="Session is inactive or deleted")

            # 2. Verify user matches
            result = await db.execute(
                select(User).where(User.email == decoded["email"])
            )
            user = result.scalar_one_or_none()
            if user:
                return user
        raise HTTPException(status_code=401, detail="Invalid terminal token")

    raise HTTPException(status_code=401, detail="Authentication failed")
