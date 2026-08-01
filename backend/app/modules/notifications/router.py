from uuid import UUID

from fastapi import APIRouter, status

from app.api.dependencies import SessionDep
from app.core.pagination import PageResponse, PaginationDep, paginate
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.notifications.schemas import NotificationResponse
from app.modules.notifications.service import (
    list_notifications,
    mark_all_read,
    mark_read,
    unread_count,
)

router = APIRouter()


@router.get("/notifications", response_model=PageResponse[NotificationResponse])
def list_notifications_endpoint(
    session: SessionDep,
    current_user: CurrentUserDep,
    pagination: PaginationDep,
) -> PageResponse[NotificationResponse]:
    page, page_size = pagination
    return paginate(list_notifications(session, current_user.id), page, page_size)


@router.get("/notifications/unread-count")
def unread_count_endpoint(
    session: SessionDep, current_user: CurrentUserDep
) -> dict[str, int]:
    return {"count": unread_count(session, current_user.id)}


@router.post("/notifications/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read_endpoint(session: SessionDep, current_user: CurrentUserDep) -> None:
    mark_all_read(session, current_user.id)


@router.patch(
    "/notifications/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT
)
def mark_read_endpoint(
    notification_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> None:
    mark_read(session, current_user.id, notification_id)
