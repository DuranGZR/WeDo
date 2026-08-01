from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDPrimaryKeyMixin
from app.modules.reactions.enums import ReactionValue


class ItemReaction(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "item_reactions"
    __table_args__ = (UniqueConstraint("item_id", "user_id"),)

    item_id: Mapped[UUID] = mapped_column(ForeignKey("items.id", ondelete="CASCADE"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    reaction: Mapped[ReactionValue] = mapped_column(String(10))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
