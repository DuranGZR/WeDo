from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.activities.service import record_activity
from app.modules.comments.models import Comment
from app.modules.comments.repository import comment_repository
from app.modules.comments.schemas import CommentCreate, CommentResponse, CommentUpdate
from app.modules.items.service import get_item
from app.modules.notifications.service import notify_space_members


def create_comment(
    session: Session, item_id: UUID, user_id: UUID, data: CommentCreate
) -> CommentResponse:
    item = get_item(session, item_id)
    comment = Comment(item_id=item_id, user_id=user_id, body=data.body.strip())
    session.add(comment)
    session.flush()
    record_activity(
        session,
        space_id=item.space_id,
        actor_id=user_id,
        activity_type="comment_created",
        entity_type="comment",
        entity_id=comment.id,
    )
    notify_space_members(
        session,
        space_id=item.space_id,
        actor_id=user_id,
        notification_type="comment_created",
        title="Yeni yorum",
        body="Bir içeriğe yeni yorum eklendi.",
        data={"item_id": str(item.id), "comment_id": str(comment.id)},
    )
    session.commit()
    return CommentResponse.model_validate(comment, from_attributes=True)


def list_comments(session: Session, item_id: UUID) -> list[CommentResponse]:
    return [
        CommentResponse.model_validate(item, from_attributes=True)
        for item in comment_repository.list_for_item(session, item_id)
    ]


def update_comment(
    session: Session, comment_id: UUID, user_id: UUID, data: CommentUpdate
) -> CommentResponse:
    comment = comment_repository.get_by_id(session, comment_id)
    if comment is None:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı.")
    if comment.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Bu yorumu düzenleyemezsiniz."
        )
    comment.body = data.body.strip()
    session.commit()
    return CommentResponse.model_validate(comment, from_attributes=True)


def delete_comment(session: Session, comment_id: UUID, user_id: UUID) -> None:
    comment = comment_repository.get_by_id(session, comment_id)
    if comment is None:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı.")
    if comment.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Bu yorumu silemezsiniz."
        )
    comment.deleted_at = datetime.now(UTC)
    session.commit()
