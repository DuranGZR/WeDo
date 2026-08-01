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
    notify_partner_activity: bool | None = None
    push_notifications_enabled: bool | None = None


class AccountDeleteRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
