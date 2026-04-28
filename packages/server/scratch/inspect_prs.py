import asyncio
import os
import sys
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

# Add the server directory to path so we can import models
sys.path.append(os.path.abspath("d:/repoSphere/packages/server"))

from src.db.models.pull_request import PullRequest

# Database URL
DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_9uXZzIMQDt2o@ep-shiny-pond-a1r0aitn-pooler.ap-southeast-1.aws.neon.tech/neondb?ssl=require"

async def run():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as db:
        res = await db.execute(select(PullRequest))
        prs = res.scalars().all()
        for p in prs:
            print(f"PR #{p.number}: {p.title}, Base: {p.base_branch}, Compare: {p.compare_branch}, Status: {p.status}")

if __name__ == "__main__":
    asyncio.run(run())
