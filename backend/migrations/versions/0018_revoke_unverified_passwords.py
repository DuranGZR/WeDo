"""Retire passwords left behind by legacy social account linking."""

from alembic import op

revision = "0018_revoke_unverified_passwords"
down_revision = "0017_content_safety"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # A completed password-based verification deleted its challenge. Legacy
    # social linking marked the user verified and left the challenge behind.
    affected = """
        SELECT users.id FROM users
        WHERE users.email_verified
          AND EXISTS (SELECT 1 FROM email_verifications WHERE user_id = users.id)
          AND EXISTS (
              SELECT 1 FROM auth_identities
              WHERE user_id = users.id AND provider IN ('apple', 'google')
          )
    """
    op.execute(f"UPDATE users SET password_hash = NULL WHERE id IN ({affected})")
    op.execute(
        "UPDATE refresh_sessions SET revoked_at = CURRENT_TIMESTAMP "
        f"WHERE revoked_at IS NULL AND user_id IN ({affected})"
    )
    op.execute(f"DELETE FROM device_push_tokens WHERE user_id IN ({affected})")
    op.execute(
        "DELETE FROM auth_identities WHERE provider = 'email' "
        f"AND user_id IN ({affected})"
    )
    op.execute(f"DELETE FROM email_verifications WHERE user_id IN ({affected})")


def downgrade() -> None:
    # Retired credentials and sessions cannot be restored.
    pass
