from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.plans.enums import PlanStatus


class PlanCreate(BaseModel):
    space_id: UUID
    item_id: UUID
    scheduled_at: datetime
    timezone: str = Field(default="UTC", max_length=64)
    note: str | None = Field(default=None, max_length=2000)
    reminder_minutes_before: int | None = Field(default=None, ge=5, le=10080)


class PlanUpdate(BaseModel):
    scheduled_at: datetime | None = None
    timezone: str | None = Field(default=None, max_length=64)
    note: str | None = Field(default=None, max_length=2000)


class PlanResponse(BaseModel):
    id: UUID
    space_id: UUID
    item_id: UUID
    created_by: UUID
    scheduled_at: datetime
    timezone: str
    note: str | None
    status: PlanStatus
    approved_at: datetime | None
    completed_at: datetime | None
    cancelled_at: datetime | None
    created_at: datetime
    updated_at: datetime
