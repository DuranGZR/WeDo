from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.notifications.models import DevicePushToken, Notification


class NotificationRepository:
    def list_for_user(self, session: Session, user_id: UUID) -> list[Notification]:
        return list(
            session.scalars(
                select(Notification)
                .where(Notification.user_id == user_id)
                .order_by(Notification.created_at.desc())
                .limit(100)
            ).all()
        )

    def unread_count(self, session: Session, user_id: UUID) -> int:
        return (
            session.scalar(
                select(func.count())
                .select_from(Notification)
                .where(Notification.user_id == user_id, Notification.read_at.is_(None))
            )
            or 0
        )

    def get(self, session: Session, notification_id: UUID) -> Notification | None:
        return session.get(Notification, notification_id)

    def create(self, session: Session, notification: Notification) -> Notification:
        session.add(notification)
        session.flush()
        return notification

    def list_pending_pushes(
        self, session: Session, limit: int = 100
    ) -> list[Notification]:
        return list(
            session.scalars(
                select(Notification)
                .where(Notification.push_sent_at.is_(None))
                .order_by(Notification.created_at)
                .limit(limit)
            ).all()
        )

    def mark_push_sent(
        self,
        session: Session,
        notification_ids: list[UUID],
        sent_at: datetime | None = None,
    ) -> None:
        if not notification_ids:
            return
        notifications = session.scalars(
            select(Notification).where(Notification.id.in_(notification_ids))
        )
        timestamp = sent_at or datetime.now(UTC)
        for notification in notifications:
            notification.push_sent_at = timestamp

    def get_device(
        self, session: Session, user_id: UUID, device_id: str
    ) -> DevicePushToken | None:
        return session.scalar(
            select(DevicePushToken).where(
                DevicePushToken.user_id == user_id,
                DevicePushToken.device_id == device_id,
            )
        )


notification_repository = NotificationRepository()
