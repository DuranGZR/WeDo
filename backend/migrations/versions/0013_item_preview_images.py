"""add item preview images table for permanent caching

Revision ID: 0013_item_preview_images
Revises: 0012_notification_preferences
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision = "0013_item_preview_images"
down_revision = "0012_notification_preferences"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "item_preview_images",
        sa.Column("item_id", sa.Uuid(), nullable=False),
        sa.Column("data", sa.LargeBinary(), nullable=False),
        sa.Column(
            "content_type",
            sa.String(length=50),
            nullable=False,
            server_default="image/jpeg",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["item_id"], ["items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("item_id"),
    )


def downgrade() -> None:
    op.drop_table("item_preview_images")
