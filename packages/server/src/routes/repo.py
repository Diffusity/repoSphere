from typing import List
from fastapi import APIRouter, Depends, Request, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.database import get_db
from src.db.models.user import User
from src.middlewares.auth import auth_middleware, optional_auth_middleware
from src.controllers import repo as repo_controller

router = APIRouter(prefix="/api/v1/repo", tags=["repo"])

@router.get("/{owner}/{name}/pull")
async def pull_from_remote(
    owner: str,
    name: str,
    local_head: str | None = None,
    current_user: User | None = Depends(optional_auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.pull(
        owner, name, local_head, current_user, db
    )

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


@router.get("/user/{username}")
async def list_user_repositories(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.list_user_repositories(username, db)


@router.get("/user/{username}/activity")
async def get_user_activity(
    username: str,
    db: AsyncSession = Depends(get_db),
    limit: int = 10,
):
    return await repo_controller.get_user_activity(username, db, limit)


@router.get("/user/{username}/stats")
async def get_user_stats(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.get_user_stats(username, db)


@router.get("/user/{username}/contributions")
async def get_user_contributions(
    username: str,
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.get_user_contributions(username, db)


@router.get("/explore")
async def list_public_repositories(
    search: str | None = None,
    language: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.list_public_repositories(db, search, language)


@router.get("/{owner}/{name}")
async def get_repository(
    owner: str,
    name: str,
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.get_repository(owner, name, db)


@router.get("/{owner}/{name}/tree/{branch}")
@router.get("/{owner}/{name}/tree/{branch}/{path:path}")
async def get_repository_tree(
    owner: str,
    name: str,
    branch: str,
    path: str = "",
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.get_repository_tree(owner, name, branch, path, db)


@router.get("/{owner}/{name}/blob/{branch}/{path:path}")
async def get_blob_content(
    owner: str,
    name: str,
    branch: str,
    path: str,
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.get_blob_content(owner, name, branch, path, db)


@router.get("/{owner}/{name}/commits/{branch}")
async def list_commits(
    owner: str,
    name: str,
    branch: str,
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.list_commits(owner, name, branch, db, page, limit)


@router.get("/{owner}/{name}/commit/{hash}")
async def get_commit_detail(
    owner: str,
    name: str,
    hash: str,
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.get_commit_detail(owner, name, hash, db)


@router.get("/{owner}/{name}/commit/{hash}/diff")
async def get_commit_diff(
    owner: str,
    name: str,
    hash: str,
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.get_commit_diff(owner, name, hash, db)


@router.delete("/{owner}/{name}")
async def delete_repository(
    owner: str,
    name: str,
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.delete_repository(owner, name, current_user, db)


@router.patch("/{owner}/{name}")
async def update_repository(
    owner: str,
    name: str,
    payload: dict,
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.update_repository(
        owner,
        name,
        payload.get("name"),
        payload.get("description"),
        payload.get("visibility"),
        payload.get("default_branch"),
        current_user,
        db,
    )


@router.post("/{owner}/{name}/confirm-delete")
async def confirm_delete_repository(
    owner: str,
    name: str,
    payload: dict,
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.confirm_delete_repository(
        owner, name, payload.get("confirmation_name"), current_user, db
    )


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
    files: List[UploadFile] = File(default=[]),
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.push(
        owner, name, metadata, files, current_user, db
    )


@router.get("/{owner}/{name}/pull")
async def pull(
    owner: str,
    name: str,
    local_head: str | None = None,
    current_user: User | None = Depends(optional_auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await repo_controller.pull(owner, name, local_head, current_user, db)
