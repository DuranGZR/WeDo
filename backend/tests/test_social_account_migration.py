from datetime import UTC, datetime, timedelta
from pathlib import Path

from alembic.migration import MigrationContext
from alembic.operations import Operations
from alembic.script import ScriptDirectory
from app.db.base import Base
from app.modules.auth.models import AuthIdentity, EmailVerification, RefreshSession
from app.modules.notifications.models import DevicePushToken
from app.modules.users.models import User
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session


def test_legacy_social_cleanup_preserves_legitimate_passwords_and_social_identity():
    engine = create_engine("sqlite://")
    migration = ScriptDirectory(str(Path(__file__).resolve().parents[1] / "migrations"))
    revision = migration.get_revision("0018_revoke_unverified_passwords")
    now = datetime.now(UTC)
    with engine.begin() as connection, Session(connection) as session:
        Base.metadata.create_all(connection)
        for name, verified, pending, social in (
            ("legacy", True, True, True),
            ("legitimate", True, False, True),
            ("pending", False, True, False),
        ):
            user = User(
                email=f"{name}@example.com",
                display_name=name,
                email_verified=verified,
                password_hash="test-hash",
            )
            session.add(user)
            session.flush()
            session.add_all(
                [
                    AuthIdentity(
                        user_id=user.id, provider="email", provider_user_id=user.email
                    ),
                    RefreshSession(
                        user_id=user.id,
                        refresh_token_hash=f"hash-{name}",
                        expires_at=now + timedelta(days=1),
                    ),
                    DevicePushToken(
                        user_id=user.id,
                        device_id=name,
                        push_token=f"push-{name}",
                        platform="ios",
                    ),
                ]
            )
            if pending:
                session.add(
                    EmailVerification(
                        user_id=user.id,
                        code_hash="fixture",
                        sent_at=now,
                        expires_at=now + timedelta(minutes=10),
                    )
                )
            if social:
                session.add(
                    AuthIdentity(
                        user_id=user.id, provider="google", provider_user_id=name
                    )
                )
        session.flush()
        with Operations.context(MigrationContext.configure(connection)):
            revision.module.upgrade()
            revision.module.upgrade()
        session.expire_all()

        for user in session.scalars(select(User)):
            legacy = user.display_name == "legacy"
            assert user.password_hash == (None if legacy else "test-hash")
            assert user.is_active
            providers = set(
                session.scalars(
                    select(AuthIdentity.provider).where(AuthIdentity.user_id == user.id)
                )
            )
            assert ("email" in providers) is not legacy
            assert ("google" in providers) == (user.display_name != "pending")
            login = session.scalar(
                select(RefreshSession).where(RefreshSession.user_id == user.id)
            )
            assert (login.revoked_at is not None) is legacy
            device = session.scalar(
                select(DevicePushToken).where(DevicePushToken.user_id == user.id)
            )
            assert (device is None) is legacy
            challenge = session.scalar(
                select(EmailVerification).where(EmailVerification.user_id == user.id)
            )
            assert (challenge is not None) == (user.display_name == "pending")
