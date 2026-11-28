from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.activities.models import Activity
from app.modules.items.models import Item


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
        if entity_type == "item":
            item = session.get(Item, entity_id)
            if item is None:
                return []
            candidates = list(
                session.scalars(
                    select(Activity)
                    .where(Activity.space_id == item.space_id)
                    .order_by(Activity.created_at.desc())
                    .limit(200)
                ).all()
            )
            target = str(entity_id)
            return [
                act
                for act in candidates
                if (act.entity_type == "item" and act.entity_id == entity_id)
                or (
                    isinstance(act.payload, dict)
                    and act.payload.get("item_id") == target
                )
            ][:100]

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
