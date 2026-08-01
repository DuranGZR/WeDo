from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    display_name: str
    avatar_url: str | None
    email_verified: bool
    onboarding_completed: bool
    notify_partner_activity: bool
    push_notifications_enabled: bool
    created_at: datetime


class UserUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=2, max_length=80)
    avatar_url: str | None = Field(default=None, max_length=2000)
    notify_partner_activity: bool | None = None
    push_notifications_enabled: bool | None = None


class UserAvatarUpdate(BaseModel):
    avatar_url: str = Field(min_length=1, max_length=2000)
