from fastapi import APIRouter, Depends, Form
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.database import get_db
from src.db.models.user import User
from src.middlewares.auth import auth_middleware, optional_auth_middleware
from src.controllers import pulls as pulls_controller

router = APIRouter(prefix="/api/v1/repo", tags=["pulls"])

@router.post("/{owner}/{name}/pulls")
async def create_pull_request(
    owner: str,
    name: str,
    title: str = Form(...),
    description: str | None = Form(None),
    base_branch: str = Form(...),
    compare_branch: str = Form(...),
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await pulls_controller.create_pull_request(
        owner=owner,
        name=name,
        title=title,
        base_branch=base_branch,
        compare_branch=compare_branch,
        current_user=current_user,
        db=db,
        description=description
    )

@router.get("/{owner}/{name}/pulls")
async def list_pull_requests(
    owner: str,
    name: str,
    db: AsyncSession = Depends(get_db),
):
    return await pulls_controller.list_pull_requests(owner, name, db)

@router.get("/{owner}/{name}/pulls/{number}")
async def get_pull_request(
    owner: str,
    name: str,
    number: int,
    db: AsyncSession = Depends(get_db),
):
    return await pulls_controller.get_pull_request(owner, name, number, db)

@router.post("/{owner}/{name}/pulls/{number}/merge")
async def merge_pull_request(
    owner: str,
    name: str,
    number: int,
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await pulls_controller.merge_pull_request(owner, name, number, current_user, db)

@router.patch("/{owner}/{name}/pulls/{number}")
async def update_pull_request(
    owner: str,
    name: str,
    number: int,
    status: str | None = Form(None),
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await pulls_controller.update_pull_request(owner, name, number, status, current_user, db)
