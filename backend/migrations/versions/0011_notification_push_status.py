"""track notification push delivery

Revision ID: 0011_notification_push_status
Revises: 0010_memories_uploads
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision = "0011_notification_push_status"
down_revision = "0010_memories_uploads"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "notifications", sa.Column("push_sent_at", sa.DateTime(timezone=True))
    )
    op.create_index(
        "ix_notifications_push_pending",
        "notifications",
        ["push_sent_at", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_notifications_push_pending", table_name="notifications")
    op.drop_column("notifications", "push_sent_at")
