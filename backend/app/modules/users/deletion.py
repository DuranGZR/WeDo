"""Local account anonymization shared by user deletion and Apple account events."""

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.localization import message
from app.modules.auth.models import AuthIdentity, EmailVerification
from app.modules.auth.repository import auth_repository
from app.modules.notifications.models import DevicePushToken
from app.modules.users.models import User


def deactivate_user(session: Session, user: User) -> None:
    user.is_active = False
    user.email = f"deleted_{user.id}@deleted.wedo.app"
    user.display_name = message("message.deletedUser")
    user.avatar_url = None
    user.password_hash = None
    auth_repository.revoke_all_for_user(session, user.id)
    for model in (AuthIdentity, EmailVerification, DevicePushToken):
        session.execute(delete(model).where(model.user_id == user.id))
