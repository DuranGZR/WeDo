"""create items table

Revision ID: 0005_items
Revises: 0004_lists
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision = "0005_items"
down_revision = "0004_lists"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("space_id", sa.Uuid(), nullable=False),
        sa.Column("list_id", sa.Uuid(), nullable=False),
        sa.Column("created_by", sa.Uuid(), nullable=False),
        sa.Column("client_item_id", sa.String(length=255), nullable=True),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("original_url", sa.Text(), nullable=True),
        sa.Column("canonical_url", sa.Text(), nullable=True),
        sa.Column("normalized_url_hash", sa.String(length=64), nullable=True),
        sa.Column("preview_image_url", sa.Text(), nullable=True),
        sa.Column("source_domain", sa.String(length=255), nullable=True),
        sa.Column("source_app", sa.String(length=255), nullable=True),
        sa.Column("source_external_id", sa.String(length=255), nullable=True),
        sa.Column("shared_text", sa.Text(), nullable=True),
        sa.Column("metadata_status", sa.String(length=30), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
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
            ["created_by"], ["users.id"], name="fk_items_created_by_users"
        ),
        sa.ForeignKeyConstraint(
            ["list_id"], ["lists.id"], name="fk_items_list_id_lists", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["space_id"],
            ["spaces.id"],
            name="fk_items_space_id_spaces",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_items"),
        sa.UniqueConstraint("created_by", "client_item_id", name="uq_items_created_by"),
    )
    op.create_index(
        "ix_items_list_created_at", "items", ["list_id", "created_at"], unique=False
    )
    op.create_index(
        "ix_items_url_hash", "items", ["list_id", "normalized_url_hash"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_items_url_hash", table_name="items")
    op.drop_index("ix_items_list_created_at", table_name="items")
    op.drop_table("items")
