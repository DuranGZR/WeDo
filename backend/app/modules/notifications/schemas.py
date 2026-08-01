from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class NotificationResponse(BaseModel):
    id: UUID
    space_id: UUID | None
    actor_id: UUID | None
    type: str
    title: str
    body: str
    data: dict
    read_at: datetime | None
    push_sent_at: datetime | None
    created_at: datetime


class DeviceTokenCreate(BaseModel):
    device_id: str = Field(min_length=1, max_length=255)
    platform: str = Field(pattern="^(ios|android)$")
    push_token: str = Field(min_length=1, max_length=512)


class DeviceTokenResponse(BaseModel):
    id: UUID
    device_id: str
    platform: str
    push_token: str
    is_active: bool
    last_seen_at: datetime
