from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.reactions.enums import ReactionValue
from app.modules.reactions.models import ItemReaction


class ReactionRepository:
    def get(
        self, session: Session, item_id: UUID, user_id: UUID
    ) -> ItemReaction | None:
        return session.scalar(
            select(ItemReaction).where(
                ItemReaction.item_id == item_id, ItemReaction.user_id == user_id
            )
        )

    def list_for_item(self, session: Session, item_id: UUID) -> list[ItemReaction]:
        return list(
            session.scalars(
                select(ItemReaction).where(ItemReaction.item_id == item_id)
            ).all()
        )

    def want_count(self, session: Session, item_id: UUID) -> int:
        return (
            session.scalar(
                select(func.count())
                .select_from(ItemReaction)
                .where(
                    ItemReaction.item_id == item_id,
                    ItemReaction.reaction == ReactionValue.WANT,
                )
            )
            or 0
        )


reaction_repository = ReactionRepository()
