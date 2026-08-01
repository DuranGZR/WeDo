from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.modules.spaces.enums import NotificationLevel, SpaceRole, SpaceType


class Space(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "spaces"

    name: Mapped[str] = mapped_column(String(80))
    type: Mapped[SpaceType] = mapped_column(String(20), default=SpaceType.OTHER)
    created_by: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class SpaceMember(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "space_members"
    __table_args__ = (UniqueConstraint("space_id", "user_id"),)

    space_id: Mapped[UUID] = mapped_column(ForeignKey("spaces.id", ondelete="CASCADE"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    role: Mapped[SpaceRole] = mapped_column(String(20), default=SpaceRole.MEMBER)
    notification_level: Mapped[NotificationLevel] = mapped_column(
        String(20), default=NotificationLevel.ALL
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    removed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
