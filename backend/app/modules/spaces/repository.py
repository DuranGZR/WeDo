from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.spaces.models import Space, SpaceMember


class SpaceRepository:
    def create(self, session: Session, space: Space) -> Space:
        session.add(space)
        session.flush()
        return space

    def get_by_id(self, session: Session, space_id: UUID) -> Space | None:
        return session.scalar(
            select(Space).where(Space.id == space_id, Space.deleted_at.is_(None))
        )

    def list_for_user(self, session: Session, user_id: UUID) -> list[Space]:
        statement = (
            select(Space)
            .join(SpaceMember, SpaceMember.space_id == Space.id)
            .where(
                SpaceMember.user_id == user_id,
                SpaceMember.removed_at.is_(None),
                Space.deleted_at.is_(None),
            )
            .order_by(Space.created_at.desc())
        )
        return list(session.scalars(statement).all())

    def member_count(self, session: Session, space_id: UUID) -> int:
        statement = (
            select(func.count())
            .select_from(SpaceMember)
            .where(
                SpaceMember.space_id == space_id,
                SpaceMember.removed_at.is_(None),
            )
        )
        return session.scalar(statement) or 0

    def update(self, session: Session, space: Space) -> Space:
        session.flush()
        return space

    def get_member_by_id(self, session: Session, member_id: UUID) -> SpaceMember | None:
        return session.get(SpaceMember, member_id)


class SpaceMemberRepository:
    def get_by_space_and_user(
        self, session: Session, space_id: UUID, user_id: UUID
    ) -> SpaceMember | None:
        return session.scalar(
            select(SpaceMember).where(
                SpaceMember.space_id == space_id,
                SpaceMember.user_id == user_id,
                SpaceMember.removed_at.is_(None),
            )
        )

    def list_for_space(self, session: Session, space_id: UUID) -> list[SpaceMember]:
        return list(
            session.scalars(
                select(SpaceMember)
                .where(
                    SpaceMember.space_id == space_id,
                    SpaceMember.removed_at.is_(None),
                )
                .order_by(SpaceMember.joined_at)
            ).all()
        )

    def create(self, session: Session, member: SpaceMember) -> SpaceMember:
        session.add(member)
        session.flush()
        return member


space_repository = SpaceRepository()
space_member_repository = SpaceMemberRepository()
