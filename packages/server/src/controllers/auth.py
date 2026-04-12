import uuid

from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.database import get_db
from src.db.models.user import User
from src.db.models.session import TerminalSession
from src.services import jwt_service


async def get_user(
    current_user: User = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """GET /api/v1/auth/user — Return the authenticated user."""
    session_id = f"{current_user.id}:{uuid.uuid4()}"
    return {
        "success": True,
        "message": "User fetched successfully",
        "data": {
            "sessionId": session_id,
            "user": current_user.to_dict(),
        },
    }


async def create_terminal_session(
    db: AsyncSession = Depends(get_db),
):
    """POST /api/v1/auth/session — Create a new anonymous terminal session."""
    token = f"{uuid.uuid4()}:{uuid.uuid4()}:{uuid.uuid4()}"

    session = TerminalSession(token=token, status="inactive")
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return {
        "success": True,
        "message": "Session created successfully",
        "data": {
            "sessionId": str(session.id),
            "token": token,
        },
    }


async def complete_terminal_session(
    token: str,
    current_user: User = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """POST /api/v1/auth/session/{token} — Link a terminal session to the user."""
    result = await db.execute(
        select(TerminalSession).where(TerminalSession.token == token)
    )
    session = result.scalar_one_or_none()

    if not session:
        return {"success": False, "message": "Session not found"}

    if session.status == "active":
        return {"success": False, "message": "Session already used"}

    session.user_id = current_user.id
    session.status = "active"
    await db.commit()

    return {"success": True, "message": "Session validated successfully"}


async def check_terminal_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """GET /api/v1/auth/session/{sessionId} — Poll session status."""
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        return {
            "success": False,
            "message": "Invalid session ID",
            "data": {"valid": "inactive", "email": "", "token": ""},
        }

    result = await db.execute(
        select(TerminalSession).where(TerminalSession.id == sid)
    )
    session = result.scalar_one_or_none()

    if not session:
        return {
            "success": False,
            "message": "Session not found",
            "data": {"valid": "inactive", "email": "", "token": ""},
        }

    # Load the user if linked
    user: User | None = None
    if session.user_id:
        user_result = await db.execute(
            select(User).where(User.id == session.user_id)
        )
        user = user_result.scalar_one_or_none()

    if not user:
        return {
            "success": False,
            "message": "User not found",
            "data": {"valid": "inactive", "email": "", "token": ""},
        }

    jwt_token = ""
    if session.status == "active":
        jwt_token = jwt_service.generate_token(
            {"email": user.email, "sessionId": str(session.id)}
        )

    return {
        "success": True,
        "message": "Session checked successfully",
        "data": {
            "valid": session.status if session.user_id else "inactive",
            "email": user.email,
            "token": jwt_token,
        },
    }


async def logout(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """POST /api/v1/auth/logout — Invalidate terminal session."""
    auth_header = request.headers.get("authorization", "")
    parts = auth_header.split(" ", 1)

    if len(parts) == 2 and parts[0] == "Terminal":
        token = parts[1]
        decoded = jwt_service.decode_token(token)
        if decoded and decoded.get("sessionId"):
            session_id = decoded["sessionId"]
            try:
                sid = uuid.UUID(session_id)
                result = await db.execute(
                    select(TerminalSession).where(TerminalSession.id == sid)
                )
                session = result.scalar_one_or_none()
                if session:
                    session.status = "deleted"
                    await db.commit()
                    return {"success": True, "message": "Logged out successfully"}
            except ValueError:
                pass

    return {"success": True, "message": "Logged out successfully (session already cleared or not a terminal session)"}
