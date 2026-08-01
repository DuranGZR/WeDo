from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.items.models import Item


class ItemRepository:
    def get_by_id(self, session: Session, item_id: UUID) -> Item | None:
        return session.scalar(
            select(Item).where(Item.id == item_id, Item.deleted_at.is_(None))
        )

    def get_by_client_id(
        self, session: Session, user_id: UUID, client_item_id: str
    ) -> Item | None:
        return session.scalar(
            select(Item).where(
                Item.created_by == user_id, Item.client_item_id == client_item_id
            )
        )

    def get_duplicate_url(
        self, session: Session, list_id: UUID, normalized_hash: str
    ) -> Item | None:
        return session.scalar(
            select(Item).where(
                Item.list_id == list_id,
                Item.normalized_url_hash == normalized_hash,
                Item.deleted_at.is_(None),
            )
        )

    def list_for_list(self, session: Session, list_id: UUID) -> list[Item]:
        return list(
            session.scalars(
                select(Item)
                .where(Item.list_id == list_id, Item.deleted_at.is_(None))
                .order_by(Item.created_at.desc())
            ).all()
        )

    def create(self, session: Session, item: Item) -> Item:
        session.add(item)
        session.flush()
        return item


item_repository = ItemRepository()
