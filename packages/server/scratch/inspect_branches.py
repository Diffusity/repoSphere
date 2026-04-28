
import asyncio
import uuid
from sqlalchemy import select
from src.db.database import async_session
from src.db.models.repository import Repository
from src.db.models.user import User
from src.db.models.branch import Branch
from src.db.models.commit import Commit

async def inspect():
    async with async_session() as db:
        # Find the repo
        result = await db.execute(
            select(Repository).join(User).where(User.username == "user", Repository.name == "syntax_testing")
        )
        repo = result.scalar_one_or_none()
        if not repo:
            print("Repo not found")
            return

        print(f"Repo: {repo.name} (id: {repo.id})")

        # List all branches
        b_res = await db.execute(select(Branch).where(Branch.repo_id == repo.id))
        branches = b_res.scalars().all()
        for b in branches:
            print(f"Branch: {b.name} (head_commit_id: {b.head_commit_id})")
            if b.head_commit_id:
                c_res = await db.execute(select(Commit).where(Commit.id == b.head_commit_id))
                commit = c_res.scalar_one_or_none()
                print(f"  Head Commit: {commit.hash if commit else 'NOT FOUND'}")
            else:
                print("  Head Commit: NULL")

if __name__ == "__main__":
    asyncio.run(inspect())
