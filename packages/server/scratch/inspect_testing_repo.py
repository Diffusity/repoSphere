import asyncio
import os
import sys
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

# Add the server directory to path so we can import models
sys.path.append(os.path.abspath("d:/repoSphere/packages/server"))

from src.db.models.repository import Repository
from src.db.models.branch import Branch
from src.db.models.commit import Commit
from src.db.models.tree_entry import TreeEntry

# Database URL from common knowledge or env
DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_9uXZzIMQDt2o@ep-shiny-pond-a1r0aitn-pooler.ap-southeast-1.aws.neon.tech/neondb?ssl=require"

async def inspect():
    from sqlalchemy.ext.asyncio import create_async_engine
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as db:
        # Find the repository
        repo_res = await db.execute(select(Repository).where(Repository.name == "testing"))
        repo = repo_res.scalar_one_or_none()
        if not repo:
            print("Repository 'testing' not found")
            return

        print(f"Repo ID: {repo.id}")

        # Find branches
        branch_res = await db.execute(select(Branch).where(Branch.repo_id == repo.id))
        branches = branch_res.scalars().all()
        for b in branches:
            print(f"Branch: {b.name}, Head: {b.head_commit.hash if b.head_commit else 'None'}")
            
            # Get tree entries for the head commit
            if b.head_commit:
                t_res = await db.execute(select(TreeEntry).where(TreeEntry.repo_id == repo.id, TreeEntry.tree_hash == b.head_commit.tree_hash))
                entries = t_res.scalars().all()
                for e in entries:
                    print(f"  File: {e.file_path}, Blob: {e.blob_hash}")

        # Find commits to check parents
        commit_res = await db.execute(select(Commit).where(Commit.repo_id == repo.id))
        commits = commit_res.scalars().all()
        print("\nCommits:")
        for c in commits:
            print(f"Hash: {c.hash}, Parents: {c.parent_hash}, Tree: {c.tree_hash}, Msg: {c.message}")

if __name__ == "__main__":
    asyncio.run(inspect())
