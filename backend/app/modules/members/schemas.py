from pydantic import BaseModel

from app.modules.spaces.enums import SpaceRole


class MemberRoleUpdate(BaseModel):
    role: SpaceRole
