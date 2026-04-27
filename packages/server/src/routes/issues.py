from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from src.db.database import get_db
from src.db.models.user import User
from src.middlewares.auth import auth_middleware
from src.controllers import issues as issues_controller

router = APIRouter(prefix="/api/v1/repo", tags=["issues"])


class CreateIssueBody(BaseModel):
    title: str
    body: str | None = None
    labels: list[str] | None = None


class UpdateIssueBody(BaseModel):
    title: str | None = None
    body: str | None = None
    status: str | None = None
    labels: list[str] | None = None


class CreateCommentBody(BaseModel):
    body: str


@router.get("/{owner}/{name}/issues")
async def list_issues(
    owner: str, name: str,
    status: str | None = None, label: str | None = None,
    page: int = 1, limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    return await issues_controller.list_issues(owner, name, status, label, page, limit, db)


@router.post("/{owner}/{name}/issues")
async def create_issue(
    owner: str, name: str, payload: CreateIssueBody,
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await issues_controller.create_issue(
        owner, name, payload.title, payload.body, payload.labels, current_user, db
    )


@router.get("/{owner}/{name}/issues/{issue_number}")
async def get_issue(
    owner: str, name: str, issue_number: int,
    db: AsyncSession = Depends(get_db),
):
    return await issues_controller.get_issue(owner, name, issue_number, db)


@router.patch("/{owner}/{name}/issues/{issue_number}")
async def update_issue(
    owner: str, name: str, issue_number: int, payload: UpdateIssueBody,
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await issues_controller.update_issue(
        owner, name, issue_number,
        payload.title, payload.body, payload.status, payload.labels,
        current_user, db
    )


@router.delete("/{owner}/{name}/issues/{issue_number}")
async def delete_issue(
    owner: str, name: str, issue_number: int,
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await issues_controller.delete_issue(owner, name, issue_number, current_user, db)


@router.post("/{owner}/{name}/issues/{issue_number}/comments")
async def add_comment(
    owner: str, name: str, issue_number: int, payload: CreateCommentBody,
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db),
):
    return await issues_controller.add_comment(
        owner, name, issue_number, payload.body, current_user, db
    )
