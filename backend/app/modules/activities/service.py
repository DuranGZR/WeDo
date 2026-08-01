from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.activities.models import Activity
from app.modules.activities.repository import activity_repository
from app.modules.activities.schemas import ActivityResponse


def record_activity(
    session: Session,
    *,
    space_id: UUID,
    actor_id: UUID,
    activity_type: str,
    entity_type: str,
    entity_id: UUID | None,
    payload: dict | None = None,
) -> Activity:
    return activity_repository.create(
        session,
        Activity(
            space_id=space_id,
            actor_id=actor_id,
            type=activity_type,
            entity_type=entity_type,
            entity_id=entity_id,
            payload=payload or {},
        ),
    )


def list_activities(session: Session, space_id: UUID) -> list[ActivityResponse]:
    return [
        ActivityResponse.model_validate(item, from_attributes=True)
        for item in activity_repository.list_for_space(session, space_id)
    ]


def list_item_activities(session: Session, item_id: UUID) -> list[ActivityResponse]:
    return [
        ActivityResponse.model_validate(item, from_attributes=True)
        for item in activity_repository.list_for_entity(session, "item", item_id)
    ]
