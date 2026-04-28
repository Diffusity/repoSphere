import asyncio
import os
import sys
import uuid
import hashlib
import json
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

sys.path.append(os.path.abspath("d:/repoSphere/packages/server"))
from src.db.models.repository import Repository
from src.db.models.commit import Commit
from src.db.models.tree_entry import TreeEntry
from src.db.models.branch import Branch
from src.db.models.pull_request import PullRequest
from src.db.models.user import User
from src.services.merge_service import find_merge_base, check_conflicts

DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_9uXZzIMQDt2o@ep-shiny-pond-a1r0aitn-pooler.ap-southeast-1.aws.neon.tech/neondb?ssl=require"

def generate_hash(content: str) -> str:
    return hashlib.sha1(content.encode()).hexdigest()

async def create_conflict_scenario():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine)

    async with async_session() as db:
        # 1. Get a user
        u_res = await db.execute(select(User).limit(1))
        user = u_res.scalar_one()
        author_name = user.username or "testuser"
        
        # 2. Create a test repo
        repo_name = f"conflict-test-{uuid.uuid4().hex[:6]}"
        repo = Repository(owner_id=user.id, name=repo_name, visibility="public", default_branch="master")
        db.add(repo)
        await db.flush()
        print(f"Created repo: {repo_name} (ID: {repo.id})")

        # 3. Initial Commit (Base)
        base_tree_hash = f"tree-base-{uuid.uuid4().hex[:4]}"
        base_commit_hash = f"commit-base-{uuid.uuid4().hex[:4]}"
        
        # Add a file in base
        base_entry = TreeEntry(repo_id=repo.id, tree_hash=base_tree_hash, file_path="hello.txt", blob_hash=generate_hash("Hello Base"))
        db.add(base_entry)
        
        base_commit = Commit(
            repo_id=repo.id,
            hash=base_commit_hash,
            tree_hash=base_tree_hash,
            parent_hash="0000000000000000000000000000000000000000",
            message="Initial commit",
            author=author_name,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(base_commit)
        await db.flush()

        # 4. Master Change
        master_tree_hash = "tree-master"
        master_commit_hash = "commit-master"
        
        master_entry = TreeEntry(repo_id=repo.id, tree_hash=master_tree_hash, file_path="hello.txt", blob_hash=generate_hash("Hello Master"))
        db.add(master_entry)
        
        master_commit = Commit(
            repo_id=repo.id,
            hash=master_commit_hash,
            tree_hash=master_tree_hash,
            parent_hash=base_commit_hash,
            message="Master changed file",
            author=author_name,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(master_commit)
        
        # Update master branch
        master_branch = Branch(repo_id=repo.id, name="master", head_commit_id=master_commit.id)
        db.add(master_branch)
        await db.flush()

        # 5. Feature Change (based on Base)
        feat_tree_hash = "tree-feat"
        feat_commit_hash = "commit-feat"
        
        feat_entry = TreeEntry(repo_id=repo.id, tree_hash=feat_tree_hash, file_path="hello.txt", blob_hash=generate_hash("Hello Feat"))
        db.add(feat_entry)
        
        feat_commit = Commit(
            repo_id=repo.id,
            hash=feat_commit_hash,
            tree_hash=feat_tree_hash,
            parent_hash=base_commit_hash,
            message="Feat changed file",
            author=author_name,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(feat_commit)
        
        # Create feat branch
        feat_branch = Branch(repo_id=repo.id, name="feat", head_commit_id=feat_commit.id)
        db.add(feat_branch)
        await db.flush()

        # 6. Test Conflict Detection
        print(f"Testing conflicts between {feat_commit_hash} and {master_commit_hash}")
        found_base = await find_merge_base(db, str(repo.id), feat_commit_hash, master_commit_hash)
        print(f"Found merge base: {found_base} (Expected: {base_commit_hash})")
        
        is_mergeable, conflicts = await check_conflicts(db, str(repo.id), found_base, master_commit_hash, feat_commit_hash)
        print(f"Is Mergeable: {is_mergeable} (Expected: False)")
        print(f"Conflicts: {conflicts} (Expected: ['hello.txt'])")

        await db.commit()

if __name__ == "__main__":
    asyncio.run(create_conflict_scenario())
