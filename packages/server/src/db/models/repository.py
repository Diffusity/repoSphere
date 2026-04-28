import uuid
from datetime import datetime, timezone

from sqlalchemy import String, ForeignKey, DateTime, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from src.db.database import Base


class Repository(Base):
    __tablename__ = "repositories"
    __table_args__ = (
        UniqueConstraint("owner_id", "name", name="uq_repo_owner_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    visibility: Mapped[str] = mapped_column(String, nullable=False, default="public")
    language: Mapped[str | None] = mapped_column(String, nullable=True)
    default_branch: Mapped[str] = mapped_column(String, nullable=False, default="master")
    stars: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    forks: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    forked_from_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("repositories.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    owner = relationship("User", lazy="selectin")
    branches = relationship("Branch", back_populates="repository", cascade="all, delete-orphan")
    commits = relationship("Commit", back_populates="repository", cascade="all, delete-orphan")
    issues = relationship("Issue", back_populates="repository", cascade="all, delete-orphan")
    stars_entries = relationship("Star", back_populates="repository", cascade="all, delete-orphan")
    pull_requests = relationship("PullRequest", back_populates="repository", cascade="all, delete-orphan")
    tree_entries = relationship("TreeEntry", back_populates="repository", cascade="all, delete-orphan")
    blobs = relationship("Blob", back_populates="repository", cascade="all, delete-orphan")
    forked_from = relationship(
        "Repository", 
        remote_side=[id], 
        primaryjoin="Repository.forked_from_id == Repository.id",
        lazy="selectin"
    )

    def to_dict(self) -> dict:
        d = {
            "id": str(self.id),
            "ownerId": str(self.owner_id),
            "ownerUsername": self.owner.username if self.owner else None,
            "name": self.name,
            "description": self.description,
            "visibility": self.visibility,
            "language": self.language,
            "defaultBranch": self.default_branch,
            "stars": self.stars,
            "forks": self.forks,
            "updatedAt": self.updated_at.isoformat(),
        }
        if self.forked_from_id:
            if self.forked_from:
                d["forkedFrom"] = {
                    "id": str(self.forked_from.id),
                    "name": self.forked_from.name,
                    "ownerUsername": self.forked_from.owner.username if self.forked_from.owner else None,
                }
            else:
                d["sourceDeleted"] = True
        return d
