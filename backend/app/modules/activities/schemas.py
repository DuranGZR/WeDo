from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ActivityResponse(BaseModel):
    id: UUID
    space_id: UUID
    actor_id: UUID
    type: str
    entity_type: str
    entity_id: UUID | None
    payload: dict
    created_at: datetime
