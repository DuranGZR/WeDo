from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.items.service import get_item
from app.modules.memories.models import Memory
from app.modules.memories.repository import memory_repository
from app.modules.memories.schemas import MemoryCreate, MemoryResponse, MemoryUpdate


def create_memory(
    session: Session, item_id: UUID, user_id: UUID, data: MemoryCreate
) -> MemoryResponse:
    get_item(session, item_id)
    memory = Memory(
        item_id=item_id,
        created_by=user_id,
        note=data.note,
        rating=data.rating,
        photo_url=data.photo_url,
    )
    session.add(memory)
    session.commit()
    return MemoryResponse.model_validate(memory, from_attributes=True)


def list_memories(session: Session, space_id: UUID) -> list[MemoryResponse]:
    return [
        MemoryResponse.model_validate(item, from_attributes=True)
        for item in memory_repository.list_for_space(session, space_id)
    ]


def get_memory(session: Session, memory_id: UUID) -> Memory:
    memory = memory_repository.get(session, memory_id)
    if memory is None:
        raise HTTPException(status_code=404, detail="Anı bulunamadı.")
    return memory


def update_memory(
    session: Session, memory_id: UUID, user_id: UUID, data: MemoryUpdate
) -> MemoryResponse:
    memory = get_memory(session, memory_id)
    if memory.created_by != user_id:
        raise HTTPException(status_code=403, detail="Bu anıyı düzenleyemezsiniz.")
    memory.note = data.note
    memory.rating = data.rating
    memory.photo_url = data.photo_url
    session.commit()
    return MemoryResponse.model_validate(memory, from_attributes=True)


def delete_memory(session: Session, memory_id: UUID, user_id: UUID) -> None:
    memory = get_memory(session, memory_id)
    if memory.created_by != user_id:
        raise HTTPException(status_code=403, detail="Bu anıyı silemezsiniz.")
    session.delete(memory)
    session.commit()
