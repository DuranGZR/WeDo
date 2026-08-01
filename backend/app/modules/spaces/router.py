from uuid import UUID

from fastapi import APIRouter, status

from app.api.dependencies import SessionDep
from app.core.pagination import PageResponse, PaginationDep, paginate
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.spaces.dependencies import SpaceMemberDep
from app.modules.spaces.permissions import require_space_admin
from app.modules.spaces.repository import space_member_repository
from app.modules.spaces.schemas import (
    SpaceCreate,
    SpaceMemberResponse,
    SpaceResponse,
    SpaceUpdate,
)
from app.modules.spaces.service import (
    create_space,
    delete_space,
    get_space,
    list_spaces,
    update_space,
)

router = APIRouter()


@router.post("", response_model=SpaceResponse, status_code=status.HTTP_201_CREATED)
def create_space_endpoint(
    data: SpaceCreate, session: SessionDep, current_user: CurrentUserDep
) -> SpaceResponse:
    return create_space(session, current_user.id, data)


@router.get("", response_model=PageResponse[SpaceResponse])
def list_spaces_endpoint(
    session: SessionDep,
    current_user: CurrentUserDep,
    pagination: PaginationDep,
) -> PageResponse[SpaceResponse]:
    page, page_size = pagination
    return paginate(list_spaces(session, current_user.id), page, page_size)


@router.get("/{space_id}", response_model=SpaceResponse)
def get_space_endpoint(
    space_id: UUID, session: SessionDep, member: SpaceMemberDep
) -> SpaceResponse:
    return get_space(session, space_id)


@router.patch("/{space_id}", response_model=SpaceResponse)
def update_space_endpoint(
    space_id: UUID,
    data: SpaceUpdate,
    session: SessionDep,
    member: SpaceMemberDep,
) -> SpaceResponse:
    require_space_admin(member)
    return update_space(session, space_id, data)


@router.delete("/{space_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_space_endpoint(
    space_id: UUID, session: SessionDep, member: SpaceMemberDep
) -> None:
    require_space_admin(member)
    delete_space(session, space_id)


@router.get("/{space_id}/members", response_model=PageResponse[SpaceMemberResponse])
def list_members_endpoint(
    space_id: UUID,
    session: SessionDep,
    member: SpaceMemberDep,
    pagination: PaginationDep,
) -> PageResponse[SpaceMemberResponse]:
    page, page_size = pagination
    return paginate(
        space_member_repository.list_for_space(session, space_id), page, page_size
    )
