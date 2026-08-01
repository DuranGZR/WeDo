from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.spaces.enums import SpaceRole, SpaceType


class SpaceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    type: SpaceType = SpaceType.OTHER


class SpaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    type: SpaceType | None = None


class SpaceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    type: SpaceType
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    member_count: int


class SpaceMemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    role: SpaceRole
    joined_at: datetime
