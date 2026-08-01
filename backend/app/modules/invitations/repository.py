from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.invitations.models import Invitation


class InvitationRepository:
    def get_by_id(self, session: Session, invitation_id: UUID) -> Invitation | None:
        return session.get(Invitation, invitation_id)

    def get_by_token_hash(
        self, session: Session, token_hash: str, *, lock: bool = False
    ) -> Invitation | None:
        statement = select(Invitation).where(Invitation.token_hash == token_hash)
        if lock:
            statement = statement.with_for_update()
        return session.scalar(statement)

    def list_for_space(self, session: Session, space_id: UUID) -> list[Invitation]:
        return list(
            session.scalars(
                select(Invitation)
                .where(Invitation.space_id == space_id)
                .order_by(Invitation.created_at.desc())
            ).all()
        )

    def create(self, session: Session, invitation: Invitation) -> Invitation:
        session.add(invitation)
        session.flush()
        return invitation


invitation_repository = InvitationRepository()
