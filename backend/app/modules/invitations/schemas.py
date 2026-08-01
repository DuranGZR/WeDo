from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class InvitationCreate(BaseModel):
    expires_in_days: int = Field(default=7, ge=1, le=30)
    max_uses: int = Field(default=1, ge=1, le=100)


class InvitationResponse(BaseModel):
    id: UUID
    space_id: UUID
    expires_at: datetime
    max_uses: int
    use_count: int
    revoked_at: datetime | None
    invite_url: str | None = None


class InvitationPreview(BaseModel):
    id: UUID
    space_id: UUID
    expires_at: datetime
    remaining_uses: int
    space_name: str
    inviter_name: str
