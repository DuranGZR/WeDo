from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, status

from app.api.dependencies import SessionDep
from app.core.config import settings
from app.core.pagination import PageResponse, PaginationDep, paginate
from app.modules.activities.schemas import ActivityResponse
from app.modules.activities.service import list_item_activities
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.items.schemas import ItemCreate, ItemMove, ItemResponse, ItemUpdate
from app.modules.items.service import (
    complete_item,
    create_item,
    delete_item,
    get_item,
    list_items,
    move_item,
    response_for_item,
    restore_item,
    update_item,
)
from app.modules.lists.repository import list_repository
from app.modules.metadata.service import run_item_metadata_task
from app.modules.spaces.permissions import get_space_member

router = APIRouter()


def _check_list_access(session, list_id: UUID, user_id: UUID):
    target_list = list_repository.get_by_id(session, list_id)
    if target_list is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Liste bulunamadı.")
    get_space_member(session, target_list.space_id, user_id)
    return target_list


def _check_item_access(session, item_id: UUID, user_id: UUID):
    item = get_item(session, item_id)
    get_space_member(session, item.space_id, user_id)
    return item


@router.post("/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item_endpoint(
    data: ItemCreate,
    session: SessionDep,
    current_user: CurrentUserDep,
    background_tasks: BackgroundTasks,
) -> ItemResponse:
    get_space_member(session, data.space_id, current_user.id)
    _check_list_access(session, data.list_id, current_user.id)
    item = create_item(session, current_user.id, data)
    if settings.metadata_enabled and item.metadata_status == "pending":
        background_tasks.add_task(run_item_metadata_task, item.id)
    return item


@router.get("/lists/{list_id}/items", response_model=PageResponse[ItemResponse])
def list_items_endpoint(
    list_id: UUID,
    session: SessionDep,
    current_user: CurrentUserDep,
    pagination: PaginationDep,
) -> PageResponse[ItemResponse]:
    _check_list_access(session, list_id, current_user.id)
    page, page_size = pagination
    return paginate(list_items(session, list_id), page, page_size)


@router.get("/items/{item_id}", response_model=ItemResponse)
def get_item_endpoint(
    item_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> ItemResponse:
    item = _check_item_access(session, item_id, current_user.id)
    return response_for_item(session, item)


@router.patch("/items/{item_id}", response_model=ItemResponse)
def update_item_endpoint(
    item_id: UUID, data: ItemUpdate, session: SessionDep, current_user: CurrentUserDep
) -> ItemResponse:
    _check_item_access(session, item_id, current_user.id)
    return update_item(session, item_id, data)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item_endpoint(
    item_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> None:
    _check_item_access(session, item_id, current_user.id)
    delete_item(session, item_id)


@router.post("/items/{item_id}/move", response_model=ItemResponse)
def move_item_endpoint(
    item_id: UUID, data: ItemMove, session: SessionDep, current_user: CurrentUserDep
) -> ItemResponse:
    item = _check_item_access(session, item_id, current_user.id)
    _check_list_access(session, data.list_id, current_user.id)
    if list_repository.get_by_id(session, data.list_id).space_id != item.space_id:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="Hedef liste aynı alanda olmalı.")
    return move_item(session, item_id, data)


@router.post("/items/{item_id}/complete", response_model=ItemResponse)
def complete_item_endpoint(
    item_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> ItemResponse:
    _check_item_access(session, item_id, current_user.id)
    return complete_item(session, item_id)


@router.post("/items/{item_id}/restore", response_model=ItemResponse)
def restore_item_endpoint(
    item_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> ItemResponse:
    _check_item_access(session, item_id, current_user.id)
    return restore_item(session, item_id)


@router.get("/items/{item_id}/activity", response_model=PageResponse[ActivityResponse])
def list_item_activity_endpoint(
    item_id: UUID,
    session: SessionDep,
    current_user: CurrentUserDep,
    pagination: PaginationDep,
) -> PageResponse[ActivityResponse]:
    item = _check_item_access(session, item_id, current_user.id)
    page, page_size = pagination
    return paginate(list_item_activities(session, item.id), page, page_size)
