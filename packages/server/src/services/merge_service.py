import hashlib
import json
from typing import Dict, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from src.db.models.commit import Commit
from src.db.models.tree_entry import TreeEntry
from src.db.models.pull_request import PullRequest
from src.db.models.branch import Branch


async def find_merge_base(db: AsyncSession, repo_id: str, commit_a_hash: str, commit_b_hash: str) -> str | None:
    """Walks the commit parent chains to find the latest common ancestor."""
    visited_a = set()
    curr_a = commit_a_hash

    while curr_a:
        visited_a.add(curr_a)
        c_res = await db.execute(select(Commit).where(Commit.repo_id == repo_id, Commit.hash == curr_a))
        commit_a = c_res.scalar_one_or_none()
        if not commit_a or not commit_a.parent_hash:
            break
        curr_a = commit_a.parent_hash.split(",")[0].strip()

    curr_b = commit_b_hash
    while curr_b:
        if curr_b in visited_a:
            return curr_b
        
        c_res = await db.execute(select(Commit).where(Commit.repo_id == repo_id, Commit.hash == curr_b))
        commit_b = c_res.scalar_one_or_none()
        if not commit_b or not commit_b.parent_hash:
            break
        curr_b = commit_b.parent_hash.split(",")[0].strip()

    return None


async def get_tree_entries(db: AsyncSession, repo_id: str, commit_hash: str) -> Dict[str, str]:
    """Returns a map of file_path -> blob_hash for a given commit."""
    if not commit_hash:
        return {}
    
    c_res = await db.execute(select(Commit).where(Commit.repo_id == repo_id, Commit.hash == commit_hash))
    commit = c_res.scalar_one_or_none()
    if not commit:
        return {}

    t_res = await db.execute(select(TreeEntry).where(TreeEntry.repo_id == repo_id, TreeEntry.tree_hash == commit.tree_hash))
    entries = t_res.scalars().all()
    return {e.file_path: e.blob_hash for e in entries}


async def check_conflicts(db: AsyncSession, repo_id: str, base_hash: str, target_hash: str, source_hash: str) -> Tuple[bool, List[str]]:
    """Applies 3-way merge logic to detect conflicts. target_hash = base branch, source_hash = compare branch."""
    base_tree = await get_tree_entries(db, repo_id, base_hash) if base_hash else {}
    target_tree = await get_tree_entries(db, repo_id, target_hash)
    source_tree = await get_tree_entries(db, repo_id, source_hash)

    conflicts = []
    
    all_paths = set(target_tree.keys()).union(set(source_tree.keys()))
    
    for path in all_paths:
        base_val = base_tree.get(path, "")
        target_val = target_tree.get(path, "")
        source_val = source_tree.get(path, "")

        if source_val != base_val and target_val != base_val and source_val != target_val:
            conflicts.append(path)

    return len(conflicts) == 0, conflicts


def generate_tree_hash(entries_map: Dict[str, str]) -> str:
    """Generates the SHA1 hash of the tree JSON string (matching Go CLI logic)."""
    # Create the dictionary structure expected by Go CLI
    tree_dict = {"entries": entries_map}
    # Match Go's json.MarshalIndent output format
    json_str = json.dumps(tree_dict, indent=2, separators=(",", ": "))
    return hashlib.sha1(json_str.encode("utf-8")).hexdigest()


async def merge_pull_request(db: AsyncSession, pr: PullRequest, author_username: str) -> str:
    """Executes the merge, creates a new commit and tree, and updates the branch."""
    repo_id = pr.repo_id

    # 1. Get branch HEADs
    base_branch_res = await db.execute(select(Branch).where(Branch.repo_id == repo_id, Branch.name == pr.base_branch))
    base_branch = base_branch_res.scalar_one_or_none()
    
    compare_branch_res = await db.execute(select(Branch).where(Branch.repo_id == repo_id, Branch.name == pr.compare_branch))
    compare_branch = compare_branch_res.scalar_one_or_none()

    if not base_branch or not compare_branch:
        raise ValueError("Branch not found")

    target_hash = base_branch.head_commit.hash if base_branch.head_commit else ""
    source_hash = compare_branch.head_commit.hash if compare_branch.head_commit else ""

    if not target_hash or not source_hash:
        raise ValueError("Branch has no commits")

    if target_hash == source_hash:
        raise ValueError("Branches are already up to date")

    # 2. Find Merge Base
    base_hash = await find_merge_base(db, repo_id, source_hash, target_hash)

    # 3. Check Conflicts
    is_mergeable, conflicts = await check_conflicts(db, repo_id, base_hash, target_hash, source_hash)
    if not is_mergeable:
        raise ValueError(f"Merge conflict detected in: {', '.join(conflicts)}")

    # 4. Create Merged Tree
    base_tree = await get_tree_entries(db, repo_id, base_hash) if base_hash else {}
    target_tree = await get_tree_entries(db, repo_id, target_hash)
    source_tree = await get_tree_entries(db, repo_id, source_hash)

    merged_entries = {}
    all_paths = set(target_tree.keys()).union(set(source_tree.keys()))

    for path in all_paths:
        base_val = base_tree.get(path, "")
        target_val = target_tree.get(path, "")
        source_val = source_tree.get(path, "")

        if source_val != base_val and target_val != base_val and source_val != target_val:
            pass # Shouldn't happen if check_conflicts passed
        elif source_val != base_val:
            if source_val != "":
                merged_entries[path] = source_val
        elif target_val != base_val:
            if target_val != "":
                merged_entries[path] = target_val
        else:
            if base_val != "":
                merged_entries[path] = base_val

    # 5. Generate new TreeHash and store new TreeEntries
    merged_tree_hash = generate_tree_hash(merged_entries)

    # Check if this exact tree already exists in DB (to avoid duplicate records)
    existing_tree_res = await db.execute(select(TreeEntry.id).where(TreeEntry.tree_hash == merged_tree_hash).limit(1))
    if not existing_tree_res.scalar_one_or_none():
        for path, blob_hash in merged_entries.items():
            new_entry = TreeEntry(
                repo_id=repo_id,
                tree_hash=merged_tree_hash,
                file_path=path,
                blob_hash=blob_hash
            )
            db.add(new_entry)

    # 6. Create Merge Commit
    merge_parent = f"{target_hash},{source_hash}"
    timestamp_str = datetime.now().astimezone().isoformat() # Close enough to Go's time.Now().String() for hashing entropy
    
    raw_str = merged_tree_hash + merge_parent + author_username + timestamp_str
    commit_hash = hashlib.sha1(raw_str.encode("utf-8")).hexdigest()

    merge_message = f"Merge pull request #{pr.number} from {pr.compare_branch}\n\n{pr.title}"

    new_commit = Commit(
        repo_id=repo_id,
        hash=commit_hash,
        tree_hash=merged_tree_hash,
        parent_hash=merge_parent,
        message=merge_message,
        author=author_username,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(new_commit)
    await db.flush()

    # 7. Update Base Branch
    base_branch.head_commit_id = new_commit.id
    
    # 8. Update PR Status
    pr.status = "merged"
    pr.merge_commit_hash = commit_hash

    await db.commit()
    
    return commit_hash
