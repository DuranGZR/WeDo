from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.users.models import User


class UserRepository:
    def get_by_id(self, session: Session, user_id: UUID) -> User | None:
        return session.scalar(select(User).where(User.id == user_id))

    def get_by_email(self, session: Session, email: str) -> User | None:
        return session.scalar(select(User).where(User.email == email))

    def create(self, session: Session, user: User) -> User:
        session.add(user)
        session.flush()
        return user


user_repository = UserRepository()
