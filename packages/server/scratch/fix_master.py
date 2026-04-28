
import asyncio
import uuid
from sqlalchemy import select
from src.db.database import async_session
from src.db.models.repository import Repository
from src.db.models.user import User
from src.db.models.branch import Branch
from src.db.models.commit import Commit
from src.db.models.pull_request import PullRequest

async def fix():
    async with async_session() as db:
        # Find the repo
        result = await db.execute(
            select(Repository).join(User).where(User.username == "user", Repository.name == "syntax_testing")
        )
        repo = result.scalar_one_or_none()
        if not repo:
            print("Repo not found")
            return

        # Find the PR
        pr_res = await db.execute(select(PullRequest).where(PullRequest.repo_id == repo.id, PullRequest.number == 1))
        pr = pr_res.scalar_one_or_none()
        if not pr or not pr.merge_commit_hash:
            print("PR or merge commit hash not found")
            return

        print(f"Fixing master branch for {repo.name} using merge commit {pr.merge_commit_hash}")

        # Find the commit object
        c_res = await db.execute(select(Commit).where(Commit.repo_id == repo.id, Commit.hash == pr.merge_commit_hash))
        commit = c_res.scalar_one_or_none()
        if not commit:
            print("Commit object not found")
            return

        # Find the branch
        b_res = await db.execute(select(Branch).where(Branch.repo_id == repo.id, Branch.name == "master"))
        branch = b_res.scalar_one_or_none()
        if not branch:
            print("Master branch not found")
            return

        branch.head_commit_id = commit.id
        await db.commit()
        print("Successfully updated master branch head.")

if __name__ == "__main__":
    asyncio.run(fix())
