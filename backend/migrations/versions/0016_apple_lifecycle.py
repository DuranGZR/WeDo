"""Encrypted Apple grants, notification receipts and durable revocation retries."""

import sqlalchemy as sa
from alembic import op

revision = "0016_apple_lifecycle"
down_revision = "0015_localization"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for name, column_type in (
        ("apple_refresh_token", sa.Text()),
        ("apple_email_enabled", sa.Boolean()),
        ("apple_email_event_at", sa.BigInteger()),
        ("apple_revoked_at", sa.BigInteger()),
        ("apple_authorized_at", sa.BigInteger()),
    ):
        op.add_column("auth_identities", sa.Column(name, column_type, nullable=True))
    op.create_table(
        "apple_notifications",
        sa.Column("event_id", sa.String(64), primary_key=True),
        sa.Column(
            "received_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_table(
        "apple_revocations",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("client_id", sa.String(255), nullable=False),
        sa.Column("encrypted_token", sa.Text(), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column(
            "next_attempt_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_apple_revocations_next_attempt_at", "apple_revocations", ["next_attempt_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_apple_revocations_next_attempt_at", "apple_revocations")
    op.drop_table("apple_revocations")
    op.drop_table("apple_notifications")
    for name in (
        "apple_refresh_token",
        "apple_email_enabled",
        "apple_email_event_at",
        "apple_revoked_at",
        "apple_authorized_at",
    ):
        op.drop_column("auth_identities", name)
