import asyncio
import os
import sys
import uuid
import hashlib
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

sys.path.append(os.path.abspath("d:/repoSphere/packages/server"))
from src.db.models.repository import Repository
from src.db.models.commit import Commit
from src.db.models.tree_entry import TreeEntry
from src.db.models.branch import Branch

DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_9uXZzIMQDt2o@ep-shiny-pond-a1r0aitn-pooler.ap-southeast-1.aws.neon.tech/neondb?ssl=require"

def generate_hash(content: str) -> str:
    # Use UTF-8 for simple test strings, system will handle bytes
    return hashlib.sha1(content.encode()).hexdigest()

async def setup_divergent_branches():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine)

    async with async_session() as db:
        repo_res = await db.execute(select(Repository).where(Repository.name == "testing"))
        repo = repo_res.scalar_one()
        
        # Common Ancestor Commit
        base_hash = "593c20eadcca2bd100e2bbb494684aa8c1a042ff"
        base_res = await db.execute(select(Commit).where(Commit.hash == base_hash))
        base_commit = base_res.scalar_one()

        # 1. Update master to a divergent commit from base
        m_tree_hash = f"tree-m-{uuid.uuid4().hex[:4]}"
        m_commit_hash = f"commit-m-{uuid.uuid4().hex[:4]}"
        
        db.add(TreeEntry(repo_id=repo.id, tree_hash=m_tree_hash, file_path="hello.txt", blob_hash=generate_hash("Change on Master")))
        
        m_commit = Commit(
            repo_id=repo.id,
            hash=m_commit_hash,
            tree_hash=m_tree_hash,
            parent_hash=base_hash,
            message="Divergent change on master",
            author="tester",
            timestamp=datetime.now(timezone.utc)
        )
        db.add(m_commit)
        await db.flush()
        
        m_branch_res = await db.execute(select(Branch).where(Branch.repo_id == repo.id, Branch.name == "master"))
        m_branch = m_branch_res.scalar_one()
        m_branch.head_commit_id = m_commit.id

        # 2. Update feat to a divergent commit from same base
        f_tree_hash = f"tree-f-{uuid.uuid4().hex[:4]}"
        f_commit_hash = f"commit-f-{uuid.uuid4().hex[:4]}"
        
        db.add(TreeEntry(repo_id=repo.id, tree_hash=f_tree_hash, file_path="hello.txt", blob_hash=generate_hash("Change on Feat")))
        
        f_commit = Commit(
            repo_id=repo.id,
            hash=f_commit_hash,
            tree_hash=f_tree_hash,
            parent_hash=base_hash,
            message="Divergent change on feat",
            author="tester",
            timestamp=datetime.now(timezone.utc)
        )
        db.add(f_commit)
        await db.flush()
        
        f_branch_res = await db.execute(select(Branch).where(Branch.repo_id == repo.id, Branch.name == "feat"))
        f_branch = f_branch_res.scalar_one()
        f_branch.head_commit_id = f_commit.id

        await db.commit()
        print(f"Set master to {m_commit_hash} and feat to {f_commit_hash}")
        print("Both branches now diverge from 593c20e.")
        print("PR #1 should now report a conflict.")

if __name__ == "__main__":
    asyncio.run(setup_divergent_branches())
