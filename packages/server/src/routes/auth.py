from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.database import get_db
from src.db.models.user import User
from src.middlewares.auth import auth_middleware
from src.controllers import auth as auth_controller

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.get("/user")
async def get_user(
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.get_user(current_user, db)


@router.post("/session")
async def create_terminal_session(
    db: AsyncSession = Depends(get_db),
):
    return await auth_controller.create_terminal_session(db)


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
