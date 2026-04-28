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
from src.db.models.user import User

DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_9uXZzIMQDt2o@ep-shiny-pond-a1r0aitn-pooler.ap-southeast-1.aws.neon.tech/neondb?ssl=require"

def generate_hash(content: bytes) -> str:
    return hashlib.sha1(content).hexdigest()

async def create_master_conflict():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine)

    async with async_session() as db:
        # 1. Get the 'testing' repo
        repo_res = await db.execute(select(Repository).where(Repository.name == "testing"))
        repo = repo_res.scalar_one_or_none()
        if not repo:
            print("Repo 'testing' not found")
            return

        # 2. Get master branch
        branch_res = await db.execute(select(Branch).where(Branch.repo_id == repo.id, Branch.name == "master"))
        master_branch = branch_res.scalar_one_or_none()
        
        # Current master head
        curr_master_commit_res = await db.execute(select(Commit).where(Commit.id == master_branch.head_commit_id))
        curr_master = curr_master_commit_res.scalar_one()
        
        print(f"Current Master Head: {curr_master.hash}")

        # 3. Create a new tree for master
        # Content with UTF-16LE BOM: 0xFF 0xFE
        new_content = b"\xff\xfeH\x00e\x00l\x00l\x00o\x00 \x00f\x00r\x00o\x00m\x00 \x00m\x00a\x00s\x00t\x00e\x00r\x00"
        blob_hash = generate_hash(new_content)
        
        new_tree_hash = f"tree-master-{uuid.uuid4().hex[:6]}"
        
        # We need to copy other files from current tree if any
        old_entries_res = await db.execute(select(TreeEntry).where(TreeEntry.tree_hash == curr_master.tree_hash))
        old_entries = old_entries_res.scalars().all()
        
        for entry in old_entries:
            if entry.file_path == "hello.txt":
                new_entry = TreeEntry(
                    repo_id=repo.id,
                    tree_hash=new_tree_hash,
                    file_path="hello.txt",
                    blob_hash=blob_hash
                )
            else:
                new_entry = TreeEntry(
                    repo_id=repo.id,
                    tree_hash=new_tree_hash,
                    file_path=entry.file_path,
                    blob_hash=entry.blob_hash
                )
            db.add(new_entry)

        # 4. Create new commit for master
        new_commit_hash = f"master-conflict-{uuid.uuid4().hex[:6]}"
        new_commit = Commit(
            repo_id=repo.id,
            hash=new_commit_hash,
            tree_hash=new_tree_hash,
            parent_hash=curr_master.hash,
            message="Conflict-inducing commit on master",
            author=curr_master.author,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(new_commit)
        await db.flush()

        # 5. Update master branch head
        master_branch.head_commit_id = new_commit.id
        print(f"Updated Master Head to: {new_commit_hash}")

        await db.commit()
        print("Done. PR #1 should now show a conflict.")

if __name__ == "__main__":
    asyncio.run(create_master_conflict())
