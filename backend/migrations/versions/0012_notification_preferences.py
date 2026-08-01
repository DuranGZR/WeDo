"""add user notification preferences

Revision ID: 0012_notification_preferences
Revises: 0011_notification_push_status
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision = "0012_notification_preferences"
down_revision = "0011_notification_push_status"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "notify_partner_activity",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "push_notifications_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "push_notifications_enabled")
    op.drop_column("users", "notify_partner_activity")
