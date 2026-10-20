from uuid import UUID

from pydantic import BaseModel

from app.modules.spaces.enums import SpaceRole


class MemberRoleUpdate(BaseModel):
    role: SpaceRole


class LeaveSpaceRequest(BaseModel):
    successor_user_id: UUID | None = None
