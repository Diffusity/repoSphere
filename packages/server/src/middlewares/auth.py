from fastapi import Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.db.database import get_db
from src.db.models.user import User
from src.db.models.session import TerminalSession
from src.services.cookie_service import get_auth_cookie
from src.services import jwt_service


async def auth_middleware(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency that authenticates via cookie/Bearer or Terminal JWT.
    Returns the authenticated User or raises 401."""
    auth_header = request.headers.get("authorization", "")
    parts = auth_header.split(" ", 1)

    # --- Terminal JWT ---
    if len(parts) == 2 and parts[0] == "Terminal":
        token = parts[1]
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

    # --- Browser JWT from cookie first, then Bearer fallback ---
    token = get_auth_cookie(request)
    if not token and len(parts) == 2 and parts[0] == "Bearer":
        token = parts[1]

    if not token:
        raise HTTPException(status_code=401, detail="No authorization token provided")

    decoded = jwt_service.decode_token(token)
    if not decoded:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = decoded.get("sub")
    email = decoded.get("email")

    if user_id:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            return user

    if email:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            return user

    raise HTTPException(status_code=401, detail="Authentication failed")


async def optional_auth_middleware(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Authenticate when possible, otherwise return None."""
    try:
        return await auth_middleware(request, db)
    except HTTPException:
        return None

