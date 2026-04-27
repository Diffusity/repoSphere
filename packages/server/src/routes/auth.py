from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.database import get_db
from src.db.models.user import User
from src.middlewares.auth import auth_middleware, optional_auth_middleware
from src.controllers import auth as auth_controller

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register")
async def register(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.register(
        payload.get("name", ""),
        payload.get("email", ""),
        payload.get("password", ""),
        db,
    )


@router.post("/verify-email")
async def verify_email(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.verify_email(
        payload.get("email", ""),
        payload.get("otp", ""),
        db,
    )


@router.post("/resend-otp")
async def resend_otp(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.resend_otp(payload.get("email", ""), db)


@router.post("/login")
async def login(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.login(
        payload.get("email", ""),
        payload.get("password", ""),
        db,
    )


@router.post("/forgot-password")
async def forgot_password(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.forgot_password(payload.get("email", ""), db)


@router.post("/reset-password")
async def reset_password(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.reset_password(
        payload.get("email", ""),
        payload.get("otp", ""),
        payload.get("newPassword", ""),
        db,
    )


@router.get("/google")
async def google_redirect():
    return await auth_controller.google_redirect()


@router.get("/google/callback")
async def google_callback(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.google_callback(code, db)


@router.get("/user")
async def get_user(
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.get_user(current_user, db)


@router.get("/username/available/{username}")
async def check_username_available(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.check_username_available(username, db)


@router.post("/username")
async def set_username(
    username_data: dict,
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.set_username(username_data.get("username"), current_user, db)


@router.post("/session")
async def create_terminal_session(
    current_user: User | None = Depends(optional_auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.create_terminal_session(current_user, db)


@router.post("/session/cli/{token}")
async def activate_terminal_session(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.activate_terminal_session(token, db)


@router.post("/session/{token}")
async def complete_terminal_session(
    token: str,
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.complete_terminal_session(token, current_user, db)


@router.get("/session/{session_id}")
async def check_terminal_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.check_terminal_session(session_id, db)


@router.delete("/session/{session_id}")
async def revoke_terminal_session(
    session_id: str,
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.revoke_terminal_session(session_id, current_user, db)


@router.post("/logout")
async def logout(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_middleware),
):
    return await auth_controller.logout(request, db)
