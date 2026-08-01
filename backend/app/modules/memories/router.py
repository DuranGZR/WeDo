from uuid import UUID

from fastapi import APIRouter, status

from app.api.dependencies import SessionDep
from app.core.pagination import PageResponse, PaginationDep, paginate
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.items.service import get_item
from app.modules.memories.schemas import MemoryCreate, MemoryResponse, MemoryUpdate
from app.modules.memories.service import (
    create_memory,
    delete_memory,
    get_memory,
    list_memories,
    update_memory,
)
from app.modules.spaces.permissions import get_space_member

router = APIRouter()


@router.get("/spaces/{space_id}/memories", response_model=PageResponse[MemoryResponse])
def list_memories_endpoint(
    space_id: UUID,
    session: SessionDep,
    current_user: CurrentUserDep,
    pagination: PaginationDep,
) -> PageResponse[MemoryResponse]:
    get_space_member(session, space_id, current_user.id)
    page, page_size = pagination
    return paginate(list_memories(session, space_id), page, page_size)


@router.post(
    "/items/{item_id}/memories",
    response_model=MemoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_memory_endpoint(
    item_id: UUID, data: MemoryCreate, session: SessionDep, current_user: CurrentUserDep
) -> MemoryResponse:
    item = get_item(session, item_id)
    get_space_member(session, item.space_id, current_user.id)
    return create_memory(session, item_id, current_user.id, data)


@router.get("/memories/{memory_id}", response_model=MemoryResponse)
def get_memory_endpoint(
    memory_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> MemoryResponse:
    memory = get_memory(session, memory_id)
    item = get_item(session, memory.item_id)
    get_space_member(session, item.space_id, current_user.id)
    return MemoryResponse.model_validate(memory, from_attributes=True)


@router.patch("/memories/{memory_id}", response_model=MemoryResponse)
def update_memory_endpoint(
    memory_id: UUID,
    data: MemoryUpdate,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> MemoryResponse:
    return update_memory(session, memory_id, current_user.id, data)


@router.delete("/memories/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory_endpoint(
    memory_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> None:
    delete_memory(session, memory_id, current_user.id)
