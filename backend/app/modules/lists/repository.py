from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.lists.models import SpaceList


class ListRepository:
    def get_by_id(self, session: Session, list_id: UUID) -> SpaceList | None:
        return session.scalar(
            select(SpaceList).where(
                SpaceList.id == list_id,
                SpaceList.deleted_at.is_(None),
            )
        )

    def get_by_space_and_name(
        self, session: Session, space_id: UUID, normalized_name: str
    ) -> SpaceList | None:
        return session.scalar(
            select(SpaceList).where(
                SpaceList.space_id == space_id,
                SpaceList.normalized_name == normalized_name,
                SpaceList.deleted_at.is_(None),
            )
        )

    def list_for_space(self, session: Session, space_id: UUID) -> list[SpaceList]:
        return list(
            session.scalars(
                select(SpaceList)
                .where(
                    SpaceList.space_id == space_id,
                    SpaceList.deleted_at.is_(None),
                )
                .order_by(SpaceList.position, SpaceList.created_at)
            ).all()
        )

    def create(self, session: Session, item: SpaceList) -> SpaceList:
        session.add(item)
        session.flush()
        return item


list_repository = ListRepository()
