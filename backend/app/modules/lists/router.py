from uuid import UUID

from fastapi import APIRouter, status

from app.api.dependencies import SessionDep
from app.core.pagination import PageResponse, PaginationDep, paginate
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.lists.repository import list_repository
from app.modules.lists.schemas import (
    ListCreate,
    ListReorderRequest,
    ListResponse,
    ListUpdate,
)
from app.modules.lists.service import (
    create_list,
    delete_list,
    get_list,
    list_lists,
    reorder_lists,
    update_list,
)
from app.modules.spaces.dependencies import SpaceMemberDep
from app.modules.spaces.permissions import get_space_member

router = APIRouter()


@router.post(
    "/spaces/{space_id}/lists",
    response_model=ListResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_list_endpoint(
    space_id: UUID,
    data: ListCreate,
    session: SessionDep,
    member: SpaceMemberDep,
    current_user: CurrentUserDep,
) -> ListResponse:
    return create_list(session, space_id, current_user.id, data)


@router.get("/spaces/{space_id}/lists", response_model=PageResponse[ListResponse])
def list_lists_endpoint(
    space_id: UUID,
    session: SessionDep,
    member: SpaceMemberDep,
    pagination: PaginationDep,
) -> PageResponse[ListResponse]:
    page, page_size = pagination
    return paginate(list_lists(session, space_id), page, page_size)


@router.post("/lists/reorder", response_model=list[ListResponse])
def reorder_lists_endpoint(
    data: ListReorderRequest, session: SessionDep, current_user: CurrentUserDep
) -> list[ListResponse]:
    if not data.list_ids:
        return []
    item = list_repository.get_by_id(session, data.list_ids[0])
    if item is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Liste bulunamadı.")
    get_space_member(session, item.space_id, current_user.id)
    return reorder_lists(session, item.space_id, data)


@router.get("/lists/{list_id}", response_model=ListResponse)
def get_list_endpoint(
    list_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> ListResponse:
    item = get_list(session, list_id)
    get_space_member(session, item.space_id, current_user.id)
    return ListResponse.model_validate(item, from_attributes=True)


@router.patch("/lists/{list_id}", response_model=ListResponse)
def update_list_endpoint(
    list_id: UUID,
    data: ListUpdate,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> ListResponse:
    item = get_list(session, list_id)
    get_space_member(session, item.space_id, current_user.id)
    return update_list(session, list_id, data)


@router.delete("/lists/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_list_endpoint(
    list_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> None:
    item = get_list(session, list_id)
    get_space_member(session, item.space_id, current_user.id)
    delete_list(session, list_id)
