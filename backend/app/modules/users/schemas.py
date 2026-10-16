from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    display_name: str
    avatar_url: str | None
    email_verified: bool
    preferred_language: Literal["tr", "en"] = "tr"
    onboarding_completed: bool
    notify_partner_activity: bool
    push_notifications_enabled: bool
    created_at: datetime
    has_password: bool = True
    apple_email_forwarding_enabled: bool | None = None


class UserUpdate(BaseModel):
    preferred_language: Literal["tr", "en"] | None = None
    display_name: str | None = Field(default=None, min_length=2, max_length=80)
    notify_partner_activity: bool | None = None
    push_notifications_enabled: bool | None = None


class AccountDeleteRequest(BaseModel):
    current_password: str | None = Field(default=None, max_length=128)


class AccountDeletionResponse(BaseModel):
    apple_revocation: Literal["not_required", "pending", "manual"]
