import asyncio
import os
import sys
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

sys.path.append(os.path.abspath("d:/repoSphere/packages/server"))
from src.db.models.pull_request import PullRequest
from src.db.models.repository import Repository

DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_9uXZzIMQDt2o@ep-shiny-pond-a1r0aitn-pooler.ap-southeast-1.aws.neon.tech/neondb?ssl=require"

async def reopen_pr():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine)

    async with async_session() as db:
        # Get testing repo ID
        repo_res = await db.execute(select(Repository.id).where(Repository.name == "testing"))
        repo_id = repo_res.scalar_one()
        
        # Get PR #1 for this repo
        res = await db.execute(select(PullRequest).where(PullRequest.repo_id == repo_id, PullRequest.number == 1))
        pr = res.scalar_one()
        pr.status = "open"
        pr.merge_commit_hash = None
        await db.commit()
        print("PR #1 for 'testing' repo has been reopened.")

if __name__ == "__main__":
    asyncio.run(reopen_pr())
