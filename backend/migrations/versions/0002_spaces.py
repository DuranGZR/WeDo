"""create spaces and space members tables

Revision ID: 0002_spaces
Revises: 0001_auth_tables
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision = "0002_spaces"
down_revision = "0001_auth_tables"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "spaces",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("created_by", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["created_by"], ["users.id"], name="fk_spaces_created_by_users"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_spaces"),
    )
    op.create_index("ix_spaces_created_by", "spaces", ["created_by"], unique=False)
    op.create_table(
        "space_members",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("space_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("notification_level", sa.String(length=20), nullable=False),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("removed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["space_id"],
            ["spaces.id"],
            name="fk_space_members_space_id_spaces",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_space_members_user_id_users",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_space_members"),
        sa.UniqueConstraint("space_id", "user_id", name="uq_space_members_space_id"),
    )
    op.create_index(
        "ix_space_members_space_id", "space_members", ["space_id"], unique=False
    )
    op.create_index(
        "ix_space_members_user_id", "space_members", ["user_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_space_members_user_id", table_name="space_members")
    op.drop_index("ix_space_members_space_id", table_name="space_members")
    op.drop_table("space_members")
    op.drop_index("ix_spaces_created_by", table_name="spaces")
    op.drop_table("spaces")
