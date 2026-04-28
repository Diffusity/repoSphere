import asyncio
import os
import sys
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

sys.path.append(os.path.abspath("d:/repoSphere/packages/server"))
from src.controllers.pulls import get_pull_request

DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_9uXZzIMQDt2o@ep-shiny-pond-a1r0aitn-pooler.ap-southeast-1.aws.neon.tech/neondb?ssl=require"

async def check():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine)

    async with async_session() as db:
        res = await get_pull_request("user", "testing", 1, db)
        print(f"PR Status: {res['data']['status']}")
        print(f"Is Mergeable: {res['data']['isMergeable']}")
        print(f"Conflicts: {res['data']['conflicts']}")

if __name__ == "__main__":
    asyncio.run(check())
