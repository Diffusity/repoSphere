import uuid
import json
from datetime import datetime, timezone
from typing import List, Dict

from fastapi import Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.database import get_db
from src.db.models.user import User
from src.db.models.repository import Repository
from src.db.models.branch import Branch
from src.db.models.commit import Commit
from src.db.models.tree_entry import TreeEntry
from src.db.models.blob import Blob
from src.services import r2_service


async def create_repository(
    name: str,
    description: str | None,
    visibility: str,
    current_user: User,
    db: AsyncSession,
):
    """POST /api/v1/repo — Create a new repository."""
    # Check if repo already exists for this user
    result = await db.execute(
        select(Repository).where(
            Repository.owner_id == current_user.id, Repository.name == name
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Repository already exists")

    repo = Repository(
        owner_id=current_user.id,
        name=name,
        description=description,
        visibility=visibility,
    )
    db.add(repo)
    await db.commit()
    await db.refresh(repo)

    return {
        "success": True,
        "message": "Repository created successfully",
        "data": {"id": str(repo.id), "name": repo.name},
    }


async def get_repository(
    owner_email: str,
    name: str,
    db: AsyncSession,
):
    """GET /api/v1/repo/{owner}/{name} — Get repo info."""
    result = await db.execute(
        select(Repository)
        .join(User)
        .where(User.email == owner_email, Repository.name == name)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    return {
        "success": True,
        "data": {
            "id": str(repo.id),
            "name": repo.name,
            "owner": owner_email,
            "visibility": repo.visibility,
        },
    }


async def get_head_commit(
    owner_email: str,
    name: str,
    branch_name: str,
    db: AsyncSession,
):
    """GET /api/v1/repo/{owner}/{name}/branch/{branch}/head — Get head commit."""
    # 1. Get Repo
    repo_result = await db.execute(
        select(Repository)
        .join(User)
        .where(User.email == owner_email, Repository.name == name)
    )
    repo = repo_result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # 2. Get Branch
    branch_result = await db.execute(
        select(Branch).where(Branch.repo_id == repo.id, Branch.name == branch_name)
    )
    branch = branch_result.scalar_one_or_none()

    if not branch:
        return {
            "success": True,
            "data": {"exists": False, "headCommit": None},
        }

    # 3. Get Head Commit
    if not branch.head_commit_id:
        return {
            "success": True,
            "data": {"exists": False, "headCommit": None},
        }

    commit_result = await db.execute(
        select(Commit).where(Commit.id == branch.head_commit_id)
    )
    commit = commit_result.scalar_one_or_none()

    return {
        "success": True,
        "data": {
            "exists": True,
            "headCommit": {
                "hash": commit.hash,
                "message": commit.message,
                "author": commit.author,
                "timestamp": commit.timestamp.isoformat(),
            },
        },
    }


async def push(
    owner_email: str,
    name: str,
    metadata_json: str,
    files: List[UploadFile],
    current_user: User,
    db: AsyncSession,
):
    """POST /api/v1/repo/{owner}/{name}/push — Unified push endpoint."""
    # 1. Validate Repo Ownership
    repo_result = await db.execute(
        select(Repository)
        .join(User)
        .where(User.email == owner_email, Repository.name == name)
    )
    repo = repo_result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    if repo.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # 2. Parse Metadata
    try:
        metadata = json.loads(metadata_json)
        branch_name = metadata["branch"]
        commits_data = metadata["commits"]
        trees_data = metadata["trees"]  # map: tree_hash -> { file_path: blob_hash }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid metadata: {str(e)}")

    # 3. Process Blobs (Files)
    # files is a list of UploadFile, each filename is the hash
    for file in files:
        hash_val = file.filename
        # Check if blob already exists in our database for this repo
        blob_result = await db.execute(
            select(Blob).where(Blob.repo_id == repo.id, Blob.hash == hash_val)
        )
        if blob_result.scalar_one_or_none():
            continue

        # Check in R2 (global deduplication at R2 level)
        content = await file.read()
        size = len(content)
        
        # We always write to R2 (put_object handles deduplication implicitly if we want, 
        # or we just overwrite with the same content). 
        # For simplicity, we just upload and record.
        r2_key = await r2_service.upload_blob(hash_val, content)
        
        blob = Blob(
            repo_id=repo.id,
            hash=hash_val,
            size_bytes=size,
            r2_key=r2_key,
        )
        db.add(blob)

    # 4. Process Commits and TreeEntries
    last_commit_id = None
    for c_data in commits_data:
        # Check if commit already exists (prevent duplicate processing)
        existing_commit = await db.execute(
            select(Commit).where(Commit.repo_id == repo.id, Commit.hash == c_data["tree"])
        )
        if existing_commit.scalar_one_or_none():
            # Get the ID if it exists to update branch head later
            comm_res = await db.execute(select(Commit.id).where(Commit.repo_id == repo.id, Commit.hash == c_data["tree"]))
            last_commit_id = comm_res.scalar()
            continue

        dt = datetime.fromisoformat(c_data["timestamp"].replace("Z", "+00:00"))
        
        commit = Commit(
            repo_id=repo.id,
            hash=c_data["tree"], # tree is the hash in the CLI type
            parent_hash=c_data["parent"],
            tree_hash=c_data["tree"], # In this simple model, hash == tree_hash
            message=c_data["message"],
            author=c_data["author"],
            timestamp=dt,
        )
        db.add(commit)
        await db.flush() # Get ID
        last_commit_id = commit.id

        # TreeEntries for this commit
        tree_hash = c_data["tree"]
        if tree_hash in trees_data:
            entries = trees_data[tree_hash]
            for file_path, blob_hash in entries.items():
                tree_entry = TreeEntry(
                    repo_id=repo.id,
                    tree_hash=tree_hash,
                    file_path=file_path,
                    blob_hash=blob_hash,
                )
                db.add(tree_entry)

    # 5. Update Branch Head
    branch_result = await db.execute(
        select(Branch).where(Branch.repo_id == repo.id, Branch.name == branch_name)
    )
    branch = branch_result.scalar_one_or_none()

    if not branch:
        branch = Branch(repo_id=repo.id, name=branch_name, head_commit_id=last_commit_id)
        db.add(branch)
    else:
        branch.head_commit_id = last_commit_id

    await db.commit()

    return {"success": True, "message": "Pushed successfully"}
