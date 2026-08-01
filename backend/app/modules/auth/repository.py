from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auth.models import AuthIdentity, RefreshSession


class AuthRepository:
    def get_identity(
        self, session: Session, provider: str, provider_user_id: str
    ) -> AuthIdentity | None:
        return session.scalar(
            select(AuthIdentity).where(
                AuthIdentity.provider == provider,
                AuthIdentity.provider_user_id == provider_user_id,
            )
        )

    def create_identity(self, session: Session, identity: AuthIdentity) -> AuthIdentity:
        session.add(identity)
        session.flush()
        return identity

    def get_refresh_session(
        self, session: Session, session_id: UUID
    ) -> RefreshSession | None:
        return session.get(RefreshSession, session_id)

    def create_refresh_session(
        self, session: Session, refresh_session: RefreshSession
    ) -> RefreshSession:
        session.add(refresh_session)
        session.flush()
        return refresh_session

    def revoke_refresh_session(self, refresh_session: RefreshSession) -> None:
        refresh_session.revoked_at = datetime.now(UTC)

    def revoke_all_for_user(self, session: Session, user_id: UUID) -> None:
        sessions = session.scalars(
            select(RefreshSession).where(
                RefreshSession.user_id == user_id,
                RefreshSession.revoked_at.is_(None),
            )
        )
        for refresh_session in sessions:
            self.revoke_refresh_session(refresh_session)


auth_repository = AuthRepository()
