from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.db.models.user import User
from src.db.models.repository import Repository
from src.db.models.branch import Branch
from src.db.models.pull_request import PullRequest
from src.services import merge_service

async def create_pull_request(
    owner: str,
    name: str,
    title: str,
    base_branch: str,
    compare_branch: str,
    current_user: User,
    db: AsyncSession,
    description: str | None = None,
):
    result = await db.execute(
        select(Repository).join(User).where(User.username == owner, Repository.name == name)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Get max number
    max_res = await db.execute(select(PullRequest.number).where(PullRequest.repo_id == repo.id).order_by(PullRequest.number.desc()).limit(1))
    max_num = max_res.scalar_one_or_none()
    number = (max_num or 0) + 1

    pr = PullRequest(
        repo_id=repo.id,
        author_id=current_user.id,
        number=number,
        title=title,
        description=description,
        base_branch=base_branch,
        compare_branch=compare_branch
    )
    db.add(pr)
    await db.commit()
    await db.refresh(pr)

    return {"success": True, "data": pr.to_dict()}


async def list_pull_requests(owner: str, name: str, db: AsyncSession):
    result = await db.execute(
        select(Repository).join(User).where(User.username == owner, Repository.name == name)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    prs_res = await db.execute(
        select(PullRequest).where(PullRequest.repo_id == repo.id).order_by(PullRequest.created_at.desc())
    )
    prs = prs_res.scalars().all()

    return {"success": True, "data": [pr.to_dict() for pr in prs]}


async def get_pull_request(owner: str, name: str, number: int, db: AsyncSession):
    result = await db.execute(
        select(PullRequest)
        .join(Repository)
        .join(User, Repository.owner_id == User.id)
        .where(User.username == owner, Repository.name == name, PullRequest.number == number)
    )
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=404, detail="Pull request not found")

    # Dynamic check for conflicts if open
    is_mergeable = False
    conflicts = []
    
    if pr.status == "open":
        base_branch_res = await db.execute(select(Branch).where(Branch.repo_id == pr.repo_id, Branch.name == pr.base_branch))
        base_branch = base_branch_res.scalar_one_or_none()
        compare_branch_res = await db.execute(select(Branch).where(Branch.repo_id == pr.repo_id, Branch.name == pr.compare_branch))
        compare_branch = compare_branch_res.scalar_one_or_none()

        if base_branch and base_branch.head_commit and compare_branch and compare_branch.head_commit:
            target_hash = base_branch.head_commit.hash
            source_hash = compare_branch.head_commit.hash
            
            if target_hash != source_hash:
                base_hash = await merge_service.find_merge_base(db, str(pr.repo_id), source_hash, target_hash)
                is_mergeable, conflicts = await merge_service.check_conflicts(db, str(pr.repo_id), base_hash, target_hash, source_hash)
            else:
                is_mergeable = False # Already up to date

    pr_dict = pr.to_dict()
    pr_dict["isMergeable"] = is_mergeable
    pr_dict["conflicts"] = conflicts

    return {"success": True, "data": pr_dict}


async def merge_pull_request(owner: str, name: str, number: int, current_user: User, db: AsyncSession):
    result = await db.execute(
        select(PullRequest)
        .join(Repository)
        .join(User, Repository.owner_id == User.id)
        .where(User.username == owner, Repository.name == name, PullRequest.number == number)
    )
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=404, detail="Pull request not found")

    if pr.status != "open":
        raise HTTPException(status_code=400, detail="Pull request is not open")

    try:
        commit_hash = await merge_service.merge_pull_request(db, pr, current_user.username)
        return {"success": True, "message": "Successfully merged", "data": pr.to_dict()}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
