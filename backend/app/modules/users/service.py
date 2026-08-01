from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.users.models import User
from app.modules.users.repository import user_repository


def get_user(session: Session, user_id: UUID) -> User | None:
    return user_repository.get_by_id(session, user_id)
