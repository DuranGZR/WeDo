"""Store account/device language and language-neutral notification messages."""

import sqlalchemy as sa
from alembic import op

revision = "0015_localization"
down_revision = "0014_email_verification"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "preferred_language", sa.String(2), nullable=False, server_default="tr"
        ),
    )
    op.add_column(
        "device_push_tokens",
        sa.Column("language", sa.String(2), nullable=False, server_default="tr"),
    )
    op.add_column(
        "notifications", sa.Column("title_key", sa.String(180), nullable=True)
    )
    op.add_column("notifications", sa.Column("body_key", sa.String(180), nullable=True))
    op.add_column(
        "notifications",
        sa.Column("message_params", sa.JSON(), nullable=False, server_default="{}"),
    )


def downgrade() -> None:
    for name in ("title_key", "body_key", "message_params"):
        op.drop_column("notifications", name)
    op.drop_column("device_push_tokens", "language")
    op.drop_column("users", "preferred_language")
