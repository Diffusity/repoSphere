import asyncio
import os
import sys
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

# Add the server directory to path so we can import models
sys.path.append(os.path.abspath("d:/repoSphere/packages/server"))

from src.db.models.repository import Repository
from src.db.models.branch import Branch
from src.db.models.commit import Commit

# Database URL
DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_9uXZzIMQDt2o@ep-shiny-pond-a1r0aitn-pooler.ap-southeast-1.aws.neon.tech/neondb?ssl=require"

async def run():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as db:
        # Find the repository 'testing'
        repo_res = await db.execute(select(Repository).where(Repository.name == "testing"))
        repo = repo_res.scalar_one_or_none()
        if not repo:
            print("Repo 'testing' not found")
            return

        print(f"Repo ID: {repo.id}")

        # Find all branches for this repo
        branch_res = await db.execute(select(Branch).where(Branch.repo_id == repo.id))
        branches = branch_res.scalars().all()
        for b in branches:
            # Need to join with Commit to get the hash
            c_res = await db.execute(select(Commit).where(Commit.id == b.head_commit_id))
            commit = c_res.scalar_one_or_none()
            print(f"Branch: {b.name}, Head Hash: {commit.hash if commit else 'None'}")

        # Find all commits for this repo to see history
        commit_res = await db.execute(select(Commit).where(Commit.repo_id == repo.id))
        commits = commit_res.scalars().all()
        print("\nAll Commits in Repo:")
        for c in commits:
            print(f"Hash: {c.hash}, Parent: {c.parent_hash}, Msg: {c.message}")

if __name__ == "__main__":
    asyncio.run(run())
