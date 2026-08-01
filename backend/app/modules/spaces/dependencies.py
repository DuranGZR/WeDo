from typing import Annotated
from uuid import UUID

from fastapi import Depends

from app.api.dependencies import SessionDep
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.spaces.models import SpaceMember
from app.modules.spaces.permissions import get_space_member


def space_member_dependency(
    space_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> SpaceMember:
    return get_space_member(session, space_id, current_user.id)


SpaceMemberDep = Annotated[SpaceMember, Depends(space_member_dependency)]
