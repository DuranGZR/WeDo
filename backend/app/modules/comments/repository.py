from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.comments.models import Comment


class CommentRepository:
    def get_by_id(self, session: Session, comment_id: UUID) -> Comment | None:
        return session.scalar(
            select(Comment).where(
                Comment.id == comment_id, Comment.deleted_at.is_(None)
            )
        )

    def list_for_item(self, session: Session, item_id: UUID) -> list[Comment]:
        return list(
            session.scalars(
                select(Comment)
                .where(Comment.item_id == item_id, Comment.deleted_at.is_(None))
                .order_by(Comment.created_at)
            ).all()
        )


comment_repository = CommentRepository()
