"""create plan reminders table

Revision ID: 0008_plan_reminders
Revises: 0007_plans
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision = "0008_plan_reminders"
down_revision = "0007_plans"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "plan_reminders",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("plan_id", sa.Uuid(), nullable=False),
        sa.Column("reminder_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["plan_id"],
            ["plans.id"],
            name="fk_plan_reminders_plan_id_plans",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_plan_reminders"),
    )
    op.create_index(
        "ix_plan_reminders_due",
        "plan_reminders",
        ["reminder_at", "sent_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_plan_reminders_due", table_name="plan_reminders")
    op.drop_table("plan_reminders")
