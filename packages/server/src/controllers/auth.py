import uuid
import re

from fastapi import Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.config import FRONTEND_URL
from src.db.database import get_db
from src.db.models.user import User
from src.db.models.session import TerminalSession
from src.services import jwt_service, google_oauth
from src.services.cookie_service import clear_auth_cookie, set_auth_cookie
from src.services.email_service import send_password_reset_otp, send_verification_otp
from src.services.otp_service import create_otp, verify_otp
from src.services.password_service import (
    hash_password,
    validate_password_for_bcrypt,
    verify_password,
)


async def check_username_available(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    """GET /api/v1/user/username/available/{username} — Check availability."""
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    return {"success": True, "data": {"available": user is None}}


async def register(
    name: str,
    email: str,
    password: str,
    db: AsyncSession = Depends(get_db),
):
    if not name or len(name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")
    if not password or len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    try:
        validate_password_for_bcrypt(password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    normalized_email = email.strip().lower()
    existing_result = await db.execute(select(User).where(User.email == normalized_email))
    existing_user = existing_result.scalar_one_or_none()

    if existing_user and existing_user.email_verified:
        raise HTTPException(status_code=400, detail="Email already registered")

    if existing_user and not existing_user.email_verified:
        existing_user.name = name.strip()
        existing_user.password_hash = hash_password(password)
        existing_user.provider = "email"
        await db.commit()
        user = existing_user
    else:
        user = User(
            name=name.strip(),
            email=normalized_email,
            password_hash=hash_password(password),
            provider="email",
            email_verified=False,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    code = await create_otp(db, user.id, "verify_email")
    await send_verification_otp(user.email, code, user.name)
    return {"success": True, "message": "Verification code sent", "data": {"email": user.email}}


async def verify_email(
    email: str,
    otp: str,
    db: AsyncSession = Depends(get_db),
):
    user = await verify_otp(db, email.strip().lower(), otp.strip(), "verify_email")
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    user.email_verified = True
    await db.commit()

    token = jwt_service.generate_auth_token(str(user.id), user.email)
    response = JSONResponse(
        {
            "success": True,
            "message": "Email verified successfully",
            "data": {"user": user.to_dict()},
        }
    )
    return set_auth_cookie(response, token)


async def resend_otp(
    email: str,
    db: AsyncSession = Depends(get_db),
):
    normalized_email = email.strip().lower()
    result = await db.execute(select(User).where(User.email == normalized_email))
    user = result.scalar_one_or_none()

    if not user:
        return {"success": True, "message": "If the email exists, a code has been sent"}
    if user.email_verified:
        return {"success": True, "message": "Email already verified"}

    code = await create_otp(db, user.id, "verify_email")
    await send_verification_otp(user.email, code, user.name)
    return {"success": True, "message": "Verification code resent"}


async def login(
    email: str,
    password: str,
    db: AsyncSession = Depends(get_db),
):
    normalized_email = email.strip().lower()
    result = await db.execute(select(User).where(User.email == normalized_email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.email_verified:
        return {
            "success": False,
            "message": "Email verification required",
            "data": {"needsVerification": True, "email": user.email},
        }

    token = jwt_service.generate_auth_token(str(user.id), user.email)
    response = JSONResponse(
        {
            "success": True,
            "message": "Login successful",
            "data": {"user": user.to_dict()},
        }
    )
    return set_auth_cookie(response, token)


async def forgot_password(
    email: str,
    db: AsyncSession = Depends(get_db),
):
    normalized_email = email.strip().lower()
    result = await db.execute(select(User).where(User.email == normalized_email))
    user = result.scalar_one_or_none()

    if user:
        code = await create_otp(db, user.id, "reset_password")
        await send_password_reset_otp(user.email, code, user.name)

    return {"success": True, "message": "If the email exists, a reset code has been sent"}


async def reset_password(
    email: str,
    otp: str,
    new_password: str,
    db: AsyncSession = Depends(get_db),
):
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    try:
        validate_password_for_bcrypt(new_password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    user = await verify_otp(db, email.strip().lower(), otp.strip(), "reset_password")
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    user.password_hash = hash_password(new_password)
    user.email_verified = True
    await db.commit()

    token = jwt_service.generate_auth_token(str(user.id), user.email)
    response = JSONResponse(
        {
            "success": True,
            "message": "Password reset successful",
            "data": {"user": user.to_dict()},
        }
    )
    return set_auth_cookie(response, token)


async def google_redirect():
    state = str(uuid.uuid4())
    return RedirectResponse(url=google_oauth.get_google_auth_url(state), status_code=302)


async def google_callback(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    profile = await google_oauth.exchange_code_for_user(code)
    if not profile.get("email") or not profile.get("sub"):
        raise HTTPException(status_code=400, detail="Google OAuth profile is incomplete")

    email = profile["email"].strip().lower()
    result = await db.execute(
        select(User).where(or_(User.google_id == profile["sub"], User.email == email))
    )
    user = result.scalar_one_or_none()

    if user:
        user.google_id = profile["sub"]
        user.name = profile.get("name") or user.name
        user.image_url = profile.get("picture") or user.image_url
        user.provider = "google"
        user.email_verified = True
        await db.commit()
    else:
        user = User(
            google_id=profile["sub"],
            name=profile.get("name") or "User",
            email=email,
            provider="google",
            image_url=profile.get("picture"),
            email_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = jwt_service.generate_auth_token(str(user.id), user.email)
    redirect = RedirectResponse(url=f"{FRONTEND_URL.rstrip('/')}/dashboard", status_code=302)
    return set_auth_cookie(redirect, token)


async def set_username(
    username: str,
    current_user: User = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """POST /api/v1/user/username — Set username."""
    # 1. Validation
    if not username or len(username) < 3 or len(username) > 30:
        raise HTTPException(status_code=400, detail="Username must be between 3 and 30 characters")
    
    if not re.match(r"^[a-z][a-z0-9_]*$", username):
        raise HTTPException(
            status_code=400, 
            detail="Username must start with a letter and contain only lowercase letters, numbers, and underscores"
        )

    # 2. Check uniqueness
    result = await db.execute(select(User).where(User.username == username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    # 3. Update local DB
    current_user.username = username
    await db.commit()

    return {"success": True, "message": "Username set successfully", "data": current_user.to_dict()}


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
    """POST /api/v1/auth/logout — Invalidate terminal session and clear browser cookie."""
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
                    response = JSONResponse(
                        {"success": True, "message": "Logged out successfully"}
                    )
                    return clear_auth_cookie(response)
            except ValueError:
                pass

    response = JSONResponse(
        {
            "success": True,
            "message": "Logged out successfully (session already cleared or not a terminal session)",
        }
    )
    return clear_auth_cookie(response)
