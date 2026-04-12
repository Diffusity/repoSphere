from typing import List
from fastapi import APIRouter, Depends, Request, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.database import get_db
from src.db.models.user import User
from src.middlewares.auth import auth_middleware
from src.controllers import repo as repo_controller

router = APIRouter(prefix="/api/v1/repo", tags=["repo"])


@router.post("")
async def create_repository(
    name: str = Form(...),
    description: str = Form(None),
    visibility: str = Form("public"),
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.create_repository(
        name, description, visibility, current_user, db
    )


@router.get("/{owner}/{name}")
async def get_repository(
    owner: str,
    name: str,
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.get_repository(owner, name, db)


@router.get("/{owner}/{name}/branch/{branch}/head")
async def get_head_commit(
    owner: str,
    name: str,
    branch: str,
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.get_head_commit(owner, name, branch, db)


@router.post("/{owner}/{name}/push")
async def push(
    owner: str,
    name: str,
    metadata: str = Form(...),
    files: List[UploadFile] = File(...),
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.push(
        owner, name, metadata, files, current_user, db
    )
