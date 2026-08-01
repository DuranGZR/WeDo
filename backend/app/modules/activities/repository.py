from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.activities.models import Activity


class ActivityRepository:
    def create(self, session: Session, activity: Activity) -> Activity:
        session.add(activity)
        session.flush()
        return activity

    def list_for_space(self, session: Session, space_id: UUID) -> list[Activity]:
        return list(
            session.scalars(
                select(Activity)
                .where(Activity.space_id == space_id)
                .order_by(Activity.created_at.desc())
                .limit(100)
            ).all()
        )

    def list_for_entity(
        self, session: Session, entity_type: str, entity_id: UUID
    ) -> list[Activity]:
        return list(
            session.scalars(
                select(Activity)
                .where(
                    Activity.entity_type == entity_type,
                    Activity.entity_id == entity_id,
                )
                .order_by(Activity.created_at.desc())
                .limit(100)
            ).all()
        )


activity_repository = ActivityRepository()
