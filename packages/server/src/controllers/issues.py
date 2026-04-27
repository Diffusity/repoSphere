import uuid
import math
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.user import User
from src.db.models.repository import Repository
from src.db.models.issue import Issue, IssueComment


async def _get_repo(owner: str, name: str, db: AsyncSession) -> Repository:
    result = await db.execute(
        select(Repository).join(User).where(User.username == owner, Repository.name == name)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return repo


async def list_issues(
    owner: str, name: str, status: str | None, label: str | None, page: int, limit: int, db: AsyncSession
):
    """GET /api/v1/repo/{owner}/{name}/issues"""
    repo = await _get_repo(owner, name, db)

    query = (
        select(Issue)
        .options(selectinload(Issue.author), selectinload(Issue.comments))
        .where(Issue.repo_id == repo.id)
        .order_by(Issue.created_at.desc())
    )
    if status:
        query = query.where(Issue.status == status)
    if label:
        query = query.where(Issue.labels.contains([label]))

    # Total count for pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0
    total_pages = math.ceil(total / limit) if limit > 0 else 1

    if limit > 0:
        query = query.offset((page - 1) * limit).limit(limit)

    result = await db.execute(query)
    issues = result.scalars().all()

    # Count open/closed
    open_count_res = await db.execute(
        select(func.count()).where(Issue.repo_id == repo.id, Issue.status == "open")
    )
    closed_count_res = await db.execute(
        select(func.count()).where(Issue.repo_id == repo.id, Issue.status == "closed")
    )

    return {
        "success": True,
        "data": {
            "issues": [_issue_to_dict(i) for i in issues],
            "openCount": open_count_res.scalar() or 0,
            "closedCount": closed_count_res.scalar() or 0,
            "page": page,
            "totalPages": total_pages,
            "total": total,
        },
    }


async def create_issue(
    owner: str, name: str, title: str, body: str | None,
    labels: list[str] | None, current_user: User, db: AsyncSession
):
    """POST /api/v1/repo/{owner}/{name}/issues"""
    repo = await _get_repo(owner, name, db)

    # Auto-increment issue number per repo
    max_num_res = await db.execute(
        select(func.max(Issue.number)).where(Issue.repo_id == repo.id)
    )
    max_num = max_num_res.scalar() or 0

    issue = Issue(
        repo_id=repo.id,
        author_id=current_user.id,
        number=max_num + 1,
        title=title,
        body=body,
        labels=labels or [],
    )
    db.add(issue)
    await db.commit()
    
    # Re-fetch with relationships for the response
    result = await db.execute(
        select(Issue)
        .options(selectinload(Issue.author), selectinload(Issue.comments))
        .where(Issue.id == issue.id)
    )
    issue = result.scalar_one()

    return {"success": True, "data": _issue_to_dict(issue)}


async def get_issue(owner: str, name: str, issue_number: int, db: AsyncSession):
    """GET /api/v1/repo/{owner}/{name}/issues/{number}"""
    repo = await _get_repo(owner, name, db)

    result = await db.execute(
        select(Issue)
        .options(
            selectinload(Issue.author),
            selectinload(Issue.comments).selectinload(IssueComment.author)
        )
        .where(Issue.repo_id == repo.id, Issue.number == issue_number)
    )
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    return {"success": True, "data": _issue_detail_to_dict(issue)}


async def update_issue(
    owner: str, name: str, issue_number: int,
    title: str | None, body: str | None, status: str | None,
    labels: list[str] | None, current_user: User, db: AsyncSession
):
    """PATCH /api/v1/repo/{owner}/{name}/issues/{number}"""
    repo = await _get_repo(owner, name, db)

    result = await db.execute(
        select(Issue).where(Issue.repo_id == repo.id, Issue.number == issue_number)
    )
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    # Only author or repo owner can update
    if issue.author_id != current_user.id and repo.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if title is not None:
        issue.title = title
    if body is not None:
        issue.body = body
    if status is not None and status in ("open", "closed"):
        issue.status = status
    if labels is not None:
        issue.labels = labels

    issue.updated_at = datetime.now(timezone.utc)
    await db.commit()
    
    # Re-fetch with relationships
    result = await db.execute(
        select(Issue)
        .options(selectinload(Issue.author), selectinload(Issue.comments))
        .where(Issue.id == issue.id)
    )
    issue = result.scalar_one()

    return {"success": True, "data": _issue_to_dict(issue)}


async def delete_issue(owner: str, name: str, issue_number: int, current_user: User, db: AsyncSession):
    """DELETE /api/v1/repo/{owner}/{name}/issues/{number}"""
    repo = await _get_repo(owner, name, db)

    result = await db.execute(
        select(Issue).where(Issue.repo_id == repo.id, Issue.number == issue_number)
    )
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    # Only repo owner can delete
    if repo.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the repository owner can delete issues")

    await db.delete(issue)
    await db.commit()
    return {"success": True, "data": {"deleted": True}}


async def add_comment(
    owner: str, name: str, issue_number: int,
    body: str, current_user: User, db: AsyncSession
):
    """POST /api/v1/repo/{owner}/{name}/issues/{number}/comments"""
    repo = await _get_repo(owner, name, db)

    result = await db.execute(
        select(Issue).where(Issue.repo_id == repo.id, Issue.number == issue_number)
    )
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    comment = IssueComment(
        issue_id=issue.id,
        author_id=current_user.id,
        body=body,
    )
    db.add(comment)
    issue.updated_at = datetime.now(timezone.utc)
    await db.commit()
    
    # Re-fetch with author
    result = await db.execute(
        select(IssueComment)
        .options(selectinload(IssueComment.author))
        .where(IssueComment.id == comment.id)
    )
    comment = result.scalar_one()

    return {"success": True, "data": _comment_to_dict(comment)}


def _issue_to_dict(issue: Issue) -> dict:
    return {
        "id": str(issue.id),
        "number": issue.number,
        "title": issue.title,
        "body": issue.body,
        "status": issue.status,
        "labels": issue.labels or [],
        "authorUsername": issue.author.username if issue.author else None,
        "commentCount": len(issue.comments) if issue.comments else 0,
        "createdAt": issue.created_at.isoformat(),
        "updatedAt": issue.updated_at.isoformat(),
    }


def _issue_detail_to_dict(issue: Issue) -> dict:
    d = _issue_to_dict(issue)
    d["comments"] = [_comment_to_dict(c) for c in (issue.comments or [])]
    return d


def _comment_to_dict(comment: IssueComment) -> dict:
    return {
        "id": str(comment.id),
        "body": comment.body,
        "authorUsername": comment.author.username if comment.author else None,
        "createdAt": comment.created_at.isoformat(),
        "updatedAt": comment.updated_at.isoformat(),
    }
