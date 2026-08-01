from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.notifications.models import DevicePushToken, Notification
from app.modules.notifications.push import send_expo_push
from app.modules.notifications.repository import notification_repository
from app.modules.notifications.schemas import (
    DeviceTokenCreate,
    DeviceTokenResponse,
    NotificationResponse,
)
from app.modules.spaces.models import SpaceMember
from app.modules.users.models import User


def create_notification(
    session: Session,
    *,
    user_id: UUID,
    notification_type: str,
    title: str,
    body: str,
    space_id: UUID | None = None,
    actor_id: UUID | None = None,
    data: dict | None = None,
) -> Notification:
    return notification_repository.create(
        session,
        Notification(
            user_id=user_id,
            space_id=space_id,
            actor_id=actor_id,
            type=notification_type,
            title=title,
            body=body,
            data=data or {},
        ),
    )


def notify_space_members(
    session: Session,
    *,
    space_id: UUID,
    actor_id: UUID,
    notification_type: str,
    title: str,
    body: str,
    data: dict | None = None,
) -> None:
    member_ids = session.scalars(
        select(SpaceMember.user_id).where(
            SpaceMember.space_id == space_id,
            SpaceMember.user_id != actor_id,
            SpaceMember.removed_at.is_(None),
        )
    )
    for user_id in member_ids:
        user = session.get(User, user_id)
        if user is None or not user.notify_partner_activity:
            continue
        create_notification(
            session,
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            body=body,
            space_id=space_id,
            actor_id=actor_id,
            data=data,
        )


def list_notifications(session: Session, user_id: UUID) -> list[NotificationResponse]:
    return [
        NotificationResponse.model_validate(item, from_attributes=True)
        for item in notification_repository.list_for_user(session, user_id)
    ]


def dispatch_pending_pushes(session: Session, limit: int = 100) -> int:
    pending = notification_repository.list_pending_pushes(session, limit)
    if not pending:
        return 0
    user_ids = {notification.user_id for notification in pending}
    tokens = session.scalars(
        select(DevicePushToken).where(
            DevicePushToken.user_id.in_(user_ids), DevicePushToken.is_active.is_(True)
        )
    ).all()
    tokens_by_user: dict[UUID, list[DevicePushToken]] = {}
    for token in tokens:
        tokens_by_user.setdefault(token.user_id, []).append(token)
    messages = []
    delivered_ids = []
    for notification in pending:
        user = session.get(User, notification.user_id)
        if user is None or not user.push_notifications_enabled:
            continue
        for token in tokens_by_user.get(notification.user_id, []):
            messages.append(
                {
                    "to": token.push_token,
                    "title": notification.title,
                    "body": notification.body,
                    "data": notification.data,
                }
            )
        if tokens_by_user.get(notification.user_id):
            delivered_ids.append(notification.id)
    if send_expo_push(messages):
        notification_repository.mark_push_sent(session, delivered_ids)
        session.commit()
        return len(delivered_ids)
    session.rollback()
    return 0


def unread_count(session: Session, user_id: UUID) -> int:
    return notification_repository.unread_count(session, user_id)


def mark_read(session: Session, user_id: UUID, notification_id: UUID) -> None:
    notification = notification_repository.get(session, notification_id)
    if notification is None or notification.user_id != user_id:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı.")
    notification.read_at = datetime.now(UTC)
    session.commit()


def mark_all_read(session: Session, user_id: UUID) -> None:
    for notification in notification_repository.list_for_user(session, user_id):
        if notification.read_at is None:
            notification.read_at = datetime.now(UTC)
    session.commit()


def register_device(
    session: Session, user_id: UUID, data: DeviceTokenCreate
) -> DeviceTokenResponse:
    device = notification_repository.get_device(session, user_id, data.device_id)
    if device is None:
        device = DevicePushToken(
            user_id=user_id,
            device_id=data.device_id,
            platform=data.platform,
            push_token=data.push_token,
        )
        session.add(device)
    else:
        device.platform = data.platform
        device.push_token = data.push_token
        device.is_active = True
        device.last_seen_at = datetime.now(UTC)
    session.commit()
    return DeviceTokenResponse.model_validate(device, from_attributes=True)
