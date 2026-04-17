"""remove clerk add auth

Revision ID: a6fc03bc2718
Revises: 
Create Date: 2026-04-17 16:14:27.484922

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a6fc03bc2718'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    user_columns = {col["name"] for col in inspector.get_columns("users")}

    if "clerk_id" in user_columns and "google_id" not in user_columns:
        op.alter_column("users", "clerk_id", new_column_name="google_id")

    if "password_hash" not in user_columns:
        op.add_column("users", sa.Column("password_hash", sa.String(), nullable=True))

    if "email_verified" not in user_columns:
        op.add_column(
            "users",
            sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        )

    table_names = set(inspector.get_table_names())
    if "otps" not in table_names:
        op.create_table(
            "otps",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("code", sa.String(length=6), nullable=False),
            sa.Column("purpose", sa.String(length=50), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("used", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    otp_indexes = {idx["name"] for idx in inspector.get_indexes("otps")} if "otps" in set(inspector.get_table_names()) else set()
    if op.f("ix_otps_user_id") not in otp_indexes:
        op.create_index(op.f("ix_otps_user_id"), "otps", ["user_id"], unique=False)
    if op.f("ix_otps_purpose") not in otp_indexes:
        op.create_index(op.f("ix_otps_purpose"), "otps", ["purpose"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_otps_purpose"), table_name="otps")
    op.drop_index(op.f("ix_otps_user_id"), table_name="otps")
    op.drop_table("otps")
    op.drop_column("users", "email_verified")
    op.drop_column("users", "password_hash")
    op.alter_column("users", "google_id", new_column_name="clerk_id")
