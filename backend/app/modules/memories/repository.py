from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.items.models import Item
from app.modules.memories.models import Memory


class MemoryRepository:
    def get(self, session: Session, memory_id: UUID) -> Memory | None:
        return session.get(Memory, memory_id)

    def list_for_space(self, session: Session, space_id: UUID) -> list[Memory]:
        return list(
            session.scalars(
                select(Memory)
                .join(Item, Item.id == Memory.item_id)
                .where(Item.space_id == space_id)
                .order_by(Memory.created_at.desc())
            ).all()
        )


memory_repository = MemoryRepository()
