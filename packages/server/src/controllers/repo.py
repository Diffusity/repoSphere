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
from src.services import r2_service, diff_service


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


async def list_user_repositories(
    username: str,
    db: AsyncSession,
):
    """GET /api/v1/repo/user/{username} — List all repos owned by a user."""
    result = await db.execute(
        select(Repository)
        .join(User)
        .where(User.username == username)
    )
    repos = result.scalars().all()
    return {
        "success": True,
        "data": [repo.to_dict() for repo in repos],
    }


async def list_public_repositories(
    db: AsyncSession,
    search: str | None = None,
    language: str | None = None,
):
    """GET /api/v1/repo/explore — List public repositories."""
    query = select(Repository).where(Repository.visibility == "public")
    if search:
        query = query.where(Repository.name.ilike(f"%{search}%"))
    if language:
        query = query.where(Repository.language == language)
    
    result = await db.execute(query)
    repos = result.scalars().all()
    return {
        "success": True,
        "data": [repo.to_dict() for repo in repos],
    }


async def get_repository(
    owner_username: str,
    name: str,
    db: AsyncSession,
):
    """GET /api/v1/repo/{owner}/{name} — Get repo info."""
    result = await db.execute(
        select(Repository)
        .join(User)
        .where(User.username == owner_username, Repository.name == name)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    return {
        "success": True,
        "data": repo.to_dict(),
    }


async def get_repository_tree(
    owner: str,
    name: str,
    branch_name: str,
    path: str = "",
    db: AsyncSession = Depends(get_db),
):
    """GET /api/v1/repo/{owner}/{name}/tree/{branch}/{path} — Get tree at path."""
    # 1. Get Repo
    result = await db.execute(
        select(Repository).join(User).where(User.username == owner, Repository.name == name)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # 2. Get Branch
    branch_result = await db.execute(
        select(Branch).where(Branch.repo_id == repo.id, Branch.name == branch_name)
    )
    branch = branch_result.scalar_one_or_none()
    if not branch or not branch.head_commit_id:
        return {"success": True, "data": []}

    # 3. Get Head Commit's Tree Hash
    commit_result = await db.execute(
        select(Commit).where(Commit.id == branch.head_commit_id)
    )
    commit = commit_result.scalar_one_or_none()
    if not commit:
         return {"success": True, "data": []}

    # 4. Get Tree Entries
    # path is a directory prefix. We want entries where file_path starts with path/ (or is equal to path if root)
    # Actually, TreeEntry stores full file paths. We need to filter and then group by the next segment.
    stmt = select(TreeEntry).where(
        TreeEntry.repo_id == repo.id,
        TreeEntry.tree_hash == commit.tree_hash
    )
    if path:
        normalized_path = path.strip("/") + "/"
        stmt = stmt.where(TreeEntry.file_path.startswith(normalized_path))
    else:
        normalized_path = ""

    entries_result = await db.execute(stmt)
    all_entries = entries_result.scalars().all()

    # Build the tree level
    # If path = "src", we want "src/main.py", "src/utils/math.py" -> "main.py", "utils/"
    level_entries = {}
    for entry in all_entries:
        relative_path = entry.file_path[len(normalized_path):]
        parts = relative_path.split("/", 1)
        name = parts[0]
        if len(parts) == 1:
            # It's a file in this directory
            level_entries[name] = {
                "name": name,
                "type": "file",
                "hash": entry.blob_hash,
                "path": entry.file_path
            }
        else:
            # It's a directory
            if name not in level_entries:
                level_entries[name] = {
                    "name": name,
                    "type": "directory",
                    "path": normalized_path + name
                }

    return {"success": True, "data": list(level_entries.values())}


async def get_blob_content(
    owner: str,
    name: str,
    branch_name: str,
    path: str,
    db: AsyncSession,
):
    """GET /api/v1/repo/{owner}/{name}/blob/{branch}/{path} — Get blob content."""
    # 1. Get Repo
    result = await db.execute(
    select(Repository).join(User).where(User.username == owner, Repository.name == name)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # 2. Get Branch Head Commit
    branch_result = await db.execute(
        select(Branch).where(Branch.repo_id == repo.id, Branch.name == branch_name)
    )
    branch = branch_result.scalar_one_or_none()
    if not branch or not branch.head_commit_id:
        raise HTTPException(status_code=404, detail="File not found")

    commit_result = await db.execute(
        select(Commit).where(Commit.id == branch.head_commit_id)
    )
    commit = commit_result.scalar_one_or_none()

    # 3. Find Blob Hash in Tree
    entry_result = await db.execute(
        select(TreeEntry).where(
            TreeEntry.repo_id == repo.id,
            TreeEntry.tree_hash == commit.tree_hash,
            TreeEntry.file_path == path
        )
    )
    entry = entry_result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="File not found")

    # 4. Fetch from R2
    content = await r2_service.download_blob(entry.blob_hash)
    
    # 5. Decompress for legacy blobs (new blobs are stored raw)
    import zlib
    try:
        content = zlib.decompress(content)
    except zlib.error:
        pass # It was not compressed or corrupted, fallback to raw

    # Try to decode as utf-8, fallback to base64
    try:
        text = content.decode("utf-8")
        return {"success": True, "data": {"content": text, "encoding": "utf-8", "size": len(content)}}
    except Exception:
        import base64
        b64 = base64.b64encode(content).decode("ascii")
        return {"success": True, "data": {"content": b64, "encoding": "base64", "size": len(content)}}


async def get_head_commit(
    owner_username: str,
    name: str,
    branch_name: str,
    db: AsyncSession,
):
    """GET /api/v1/repo/{owner}/{name}/branch/{branch}/head — Get head commit."""
    # 1. Get Repo
    repo_result = await db.execute(
        select(Repository)
        .join(User)
        .where(User.username == owner_username, Repository.name == name)
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
    owner_username: str,
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
        .where(User.username == owner_username, Repository.name == name)
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
    try:
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
            
            # CLI sends zlib-compressed blobs from .rs/objects/; decompress before storing
            import zlib
            try:
                content = zlib.decompress(content)
            except zlib.error:
                pass  # Already raw, use as-is
                
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
                select(Commit).where(Commit.repo_id == repo.id, Commit.hash == c_data.get("hash", c_data["tree"]))
            )
            if existing_commit.scalar_one_or_none():
                # Get the ID if it exists to update branch head later
                comm_res = await db.execute(select(Commit.id).where(Commit.repo_id == repo.id, Commit.hash == c_data.get("hash", c_data["tree"])))
                last_commit_id = comm_res.scalar()
                continue

            dt = datetime.fromisoformat(c_data["timestamp"].replace("Z", "+00:00"))
            
            commit = Commit(
                repo_id=repo.id,
                hash=c_data.get("hash", c_data["tree"]), 
                parent_hash=c_data["parent"],
                tree_hash=c_data["tree"], 
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
                    # Check for existing tree entry
                    existing_entry = await db.execute(
                        select(TreeEntry).where(
                            TreeEntry.repo_id == repo.id,
                            TreeEntry.tree_hash == tree_hash,
                            TreeEntry.file_path == file_path
                        )
                    )
                    if existing_entry.scalar_one_or_none():
                        continue

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

        # Auto-detect language
        if last_commit_id and commits_data:
            last_commit_data = commits_data[-1]
            last_tree_hash = last_commit_data["tree"]
            if last_tree_hash in trees_data:
                from collections import Counter
                import os.path
                extensions = []
                for fp in trees_data[last_tree_hash].keys():
                    _, ext = os.path.splitext(fp)
                    if ext:
                        extensions.append(ext.lstrip('.'))
                if extensions:
                    most_common = Counter(extensions).most_common(1)[0][0]
                    EXTENSION_MAP = {
                        'py': 'Python', 'js': 'JavaScript', 'ts': 'TypeScript',
                        'go': 'Go', 'rs': 'Rust', 'java': 'Java', 'cpp': 'C++',
                        'c': 'C', 'rb': 'Ruby', 'php': 'PHP', 'html': 'HTML',
                        'css': 'CSS', 'md': 'Markdown', 'txt': 'Plain Text',
                        'tsx': 'TypeScript', 'jsx': 'JavaScript',
                    }
                    repo.language = EXTENSION_MAP.get(most_common, most_common.capitalize())

        repo.updated_at = datetime.now(timezone.utc)
        await db.commit()

        return {"success": True, "message": f"Pushed {len(commits_data)} commits"}

    except Exception as e:
        await db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Push failed: {str(e)}")

async def list_commits(
    owner: str,
    name: str,
    branch_name: str,
    db: AsyncSession,
    page: int = 1,
    limit: int = 20,
):
    """GET /api/v1/repo/{owner}/{name}/commits/{branch} — List commits."""
    # 1. Get Repo
    result = await db.execute(
        select(Repository).join(User).where(User.username == owner, Repository.name == name)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # 2. Get Commits
    # In this simple implementation, we don't have a full DAG in SQL yet.
    # We just fetch commits for this repo ordered by timestamp.
    # TODO: Follow parent_hash chain for the specific branch.
    stmt = (
        select(Commit)
        .where(Commit.repo_id == repo.id)
        .order_by(Commit.timestamp.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    commits_result = await db.execute(stmt)
    commits = commits_result.scalars().all()

    return {
        "success": True,
        "data": [
            {
                "hash": c.hash,
                "message": c.message,
                "author": c.author,
                "timestamp": c.timestamp.isoformat(),
            }
            for c in commits
        ],
    }


async def get_commit_detail(
    owner: str,
    name: str,
    hash: str,
    db: AsyncSession,
):
    """GET /api/v1/repo/{owner}/{name}/commit/{hash} — Get commit detail."""
    result = await db.execute(
        select(Commit)
        .join(Repository)
        .join(User)
        .where(User.username == owner, Repository.name == name, Commit.hash == hash)
    )
    commit = result.scalar_one_or_none()
    if not commit:
        raise HTTPException(status_code=404, detail="Commit not found")

    return {
        "success": True,
        "data": {
            "hash": commit.hash,
            "message": commit.message,
            "author": commit.author,
            "timestamp": commit.timestamp.isoformat(),
            "parent_hash": commit.parent_hash,
        },
    }


async def get_commit_diff(
    owner: str,
    name: str,
    hash: str,
    db: AsyncSession,
):
    """GET /api/v1/repo/{owner}/{name}/commit/{hash}/diff — Get commit diff."""
    # 1. Get Commit
    result = await db.execute(
        select(Commit)
        .join(Repository)
        .join(User)
        .where(User.username == owner, Repository.name == name, Commit.hash == hash)
    )
    commit = result.scalar_one_or_none()
    if not commit:
        raise HTTPException(status_code=404, detail="Commit not found")

    repo_id = commit.repo_id

    # 2. Get Tree Entries for this commit
    current_entries_res = await db.execute(
        select(TreeEntry).where(TreeEntry.tree_hash == commit.tree_hash, TreeEntry.repo_id == repo_id)
    )
    current_entries = {e.file_path: e.blob_hash for e in current_entries_res.scalars().all()}

    # 3. Get Parent Commit Tree Entries
    parent_entries = {}
    if commit.parent_hash:
        parent_commit_res = await db.execute(
            select(Commit).where(Commit.repo_id == repo_id, Commit.hash == commit.parent_hash)
        )
        parent_commit = parent_commit_res.scalar_one_or_none()
        if parent_commit:
            p_entries_res = await db.execute(
                select(TreeEntry).where(TreeEntry.tree_hash == parent_commit.tree_hash, TreeEntry.repo_id == repo_id)
            )
            parent_entries = {e.file_path: e.blob_hash for e in p_entries_res.scalars().all()}

    # 4. Compare trees and compute actual diffs
    diff_results = []
    
    # Helper to fetch and decompress blob text
    async def get_text(blob_hash: str | None) -> str | None:
        if not blob_hash:
            return None
        try:
            content = await r2_service.download_blob(blob_hash)
            import zlib
            try:
                content = zlib.decompress(content)
            except zlib.error:
                pass
            return content.decode("utf-8")
        except Exception:
            return None # Binary or error

    # Files added or modified
    for path, blob_hash in current_entries.items():
        if path not in parent_entries:
            # Added
            new_text = await get_text(blob_hash)
            diff_results.append(diff_service.compute_diff(None, new_text, path, "added"))
        elif parent_entries[path] != blob_hash:
            # Modified
            old_text = await get_text(parent_entries[path])
            new_text = await get_text(blob_hash)
            diff_results.append(diff_service.compute_diff(old_text, new_text, path, "modified"))

    # Files deleted
    for path, old_blob_hash in parent_entries.items():
        if path not in current_entries:
            # Deleted
            old_text = await get_text(old_blob_hash)
            diff_results.append(diff_service.compute_diff(old_text, None, path, "deleted"))

    return {"success": True, "data": diff_results}


async def update_repository(
    owner_username: str,
    repo_name: str,
    name: str | None,
    description: str | None,
    visibility: str | None,
    default_branch: str | None,
    current_user: User,
    db: AsyncSession,
):
    """PATCH /api/v1/repo/{owner}/{name} — Update repository info."""
    result = await db.execute(
        select(Repository)
        .join(User)
        .where(User.username == owner_username, Repository.name == repo_name)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    if repo.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if name is not None and name != repo.name:
        # Check uniqueness
        dup_check = await db.execute(
            select(Repository).where(Repository.owner_id == current_user.id, Repository.name == name)
        )
        if dup_check.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Repository with this name already exists")
        repo.name = name

    if description is not None:
        repo.description = description
    if visibility is not None:
        repo.visibility = visibility
    if default_branch is not None:
        repo.default_branch = default_branch

    repo.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(repo)

    return {
        "success": True,
        "message": "Repository updated successfully",
        "data": repo.to_dict(),
    }


async def confirm_delete_repository(
    owner_username: str,
    repo_name: str,
    confirmation_name: str,
    current_user: User,
    db: AsyncSession,
):
    """POST /api/v1/repo/{owner}/{name}/confirm-delete — Double-confirm delete."""
    result = await db.execute(
        select(Repository)
        .join(User)
        .where(User.username == owner_username, Repository.name == repo_name)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    if repo.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if confirmation_name != repo.name:
        raise HTTPException(status_code=400, detail="Confirmation name does not match")

    # 1. Gather all blobs to delete from R2
    blobs_result = await db.execute(select(Blob.hash).where(Blob.repo_id == repo.id))
    blob_hashes = list(blobs_result.scalars().all())

    # 2. Cleanup R2
    if blob_hashes:
        await r2_service.delete_blobs(blob_hashes)

    # 3. DB Deletion (cascades should handle branches, commits, etc. if configured, 
    # but let's be safe and rely on the repo deletion if the model has cascades)
    await db.delete(repo)
    await db.commit()

    return {"success": True, "message": "Repository and all associated data deleted"}


async def delete_repository(
    owner: str,
    name: str,
    current_user: User,
    db: AsyncSession,
):
    """DELETE /api/v1/repo/{owner}/{name} — Delete repository."""
    result = await db.execute(
        select(Repository).join(User).where(User.username == owner, Repository.name == name)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    if repo.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    await db.delete(repo)
    await db.commit()
    return {"success": True, "message": "Repository deleted"}


async def get_user_activity(
    username: str,
    db: AsyncSession,
    limit: int = 10,
):
    """GET /api/v1/repo/user/{username}/activity — List recent user activity."""
    # For now, let's just return recent commits across all user repos
    result = await db.execute(
        select(Commit, Repository.name)
        .join(Repository)
        .join(User, Repository.owner_id == User.id)
        .where(User.username == username)
        .order_by(Commit.timestamp.desc())
        .limit(limit)
    )
    activities = result.all()
    
    data = []
    for commit, repo_name in activities:
        data.append({
            "user": commit.author,
            "message": commit.message,
            "hash": commit.hash,
            "time": commit.timestamp.isoformat(),
            "repo": f"{username}/{repo_name}",
        })
    return {"success": True, "data": data}


async def get_user_stats(
    username: str,
    db: AsyncSession,
):
    """GET /api/v1/repo/user/{username}/stats — Get user stats."""
    # 1. Repo count
    repo_count_res = await db.execute(
        select(Repository)
        .join(User)
        .where(User.username == username)
    )
    repo_count = len(repo_count_res.scalars().all())

    # 2. Commits today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    commits_today_res = await db.execute(
        select(Commit)
        .join(Repository)
        .join(User, Repository.owner_id == User.id)
        .where(User.username == username, Commit.timestamp >= today_start)
    )
    commits_today = len(commits_today_res.scalars().all())

    # 3. Contributors (unique authors in all user repos)
    contributors_res = await db.execute(
        select(Commit.author)
        .join(Repository)
        .join(User, Repository.owner_id == User.id)
        .where(User.username == username)
        .distinct()
    )
    contributors = len(contributors_res.scalars().all())

    return {
        "success": True,
        "data": {
            "repoCount": repo_count,
            "commitsToday": commits_today,
            "contributors": contributors,
        },
    }


async def pull(
    owner_username: str,
    name: str,
    local_head: str | None,
    current_user: User | None,
    db: AsyncSession,
):
    """GET /api/v1/repo/{owner}/{name}/pull — Pull controller."""
    # 1. Get Repo
    result = await db.execute(
        select(Repository)
        .join(User)
        .where(User.username == owner_username, Repository.name == name)
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # 2. Check access
    if repo.visibility == "private":
        if not current_user or repo.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    # 3. Get master branch head
    branch_result = await db.execute(
        select(Branch).where(Branch.repo_id == repo.id, Branch.name == "master")
    )
    branch = branch_result.scalar_one_or_none()
    
    if not branch or not branch.head_commit_id:
        return {"success": True, "data": {"commits": [], "trees": {}, "blob_urls": {}}}

    # 4. Traverse commits back to local_head
    commits = []
    trees_map: Dict[str, Dict[str, str]] = {}
    blob_hashes = set()
    
    current_commit_id = branch.head_commit_id
    
    while current_commit_id:
        c_res = await db.execute(select(Commit).where(Commit.id == current_commit_id))
        commit = c_res.scalar_one_or_none()
        
        if not commit:
            break
            
        if commit.hash == local_head:
            break
            
        commits.append({
            "hash": commit.hash,
            "parent": commit.parent_hash,
            "tree": commit.tree_hash,
            "message": commit.message,
            "author": commit.author,
            "timestamp": commit.timestamp.isoformat().replace("+00:00", "Z"),
        })
        
        # Get tree entries if we haven't seen this tree
        if commit.tree_hash not in trees_map:
            t_res = await db.execute(
                select(TreeEntry).where(TreeEntry.tree_hash == commit.tree_hash)
            )
            entries = t_res.scalars().all()
            
            tree_dict = {}
            for e in entries:
                tree_dict[e.file_path] = e.blob_hash
                blob_hashes.add(e.blob_hash)
                
            trees_map[commit.tree_hash] = tree_dict
            
        if not commit.parent_hash:
            break
            
        # Find parent commit ID
        p_res = await db.execute(
            select(Commit.id).where(Commit.repo_id == repo.id, Commit.hash == commit.parent_hash)
        )
        current_commit_id = p_res.scalar_one_or_none()
        
    # Reverse commits so oldest comes first
    commits.reverse()
    
    # 5. Generate Presigned URLs
    blob_urls = {}
    for b_hash in blob_hashes:
        # Check if blob actually exists
        blob_res = await db.execute(
            select(Blob).where(Blob.repo_id == repo.id, Blob.hash == b_hash)
        )
        if blob_res.scalar_one_or_none():
            url = await r2_service.generate_presigned_url(b_hash)
            blob_urls[b_hash] = url

    return {
        "success": True,
        "data": {
            "commits": commits,
            "trees": trees_map,
            "blob_urls": blob_urls,
        }
    }
