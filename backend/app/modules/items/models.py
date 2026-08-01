from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.modules.items.enums import ItemStatus, ItemType, MetadataStatus


class Item(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "items"
    __table_args__ = (
        UniqueConstraint("created_by", "client_item_id"),
        Index("ix_items_list_created_at", "list_id", "created_at"),
        Index("ix_items_url_hash", "list_id", "normalized_url_hash"),
    )

    space_id: Mapped[UUID] = mapped_column(ForeignKey("spaces.id", ondelete="CASCADE"))
    list_id: Mapped[UUID] = mapped_column(ForeignKey("lists.id", ondelete="CASCADE"))
    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    client_item_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    type: Mapped[ItemType] = mapped_column(String(20), default=ItemType.URL)
    status: Mapped[ItemStatus] = mapped_column(String(30), default=ItemStatus.NEW)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    original_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    canonical_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    normalized_url_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    preview_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_app: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    shared_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_status: Mapped[MetadataStatus] = mapped_column(
        String(30), default=MetadataStatus.PENDING
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
