from fastapi import APIRouter, status

from app.api.dependencies import SessionDep
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.users.schemas import UserAvatarUpdate, UserResponse, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_current_user(current_user: CurrentUserDep) -> UserResponse:
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_current_user(
    data: UserUpdate, current_user: CurrentUserDep, session: SessionDep
) -> UserResponse:
    if data.display_name is not None:
        current_user.display_name = data.display_name.strip()
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    if data.notify_partner_activity is not None:
        current_user.notify_partner_activity = data.notify_partner_activity
    if data.push_notifications_enabled is not None:
        current_user.push_notifications_enabled = data.push_notifications_enabled
    session.commit()
    return current_user


@router.post("/me/avatar", response_model=UserResponse)
def update_current_user_avatar(
    data: UserAvatarUpdate, current_user: CurrentUserDep, session: SessionDep
) -> UserResponse:
    current_user.avatar_url = data.avatar_url
    session.commit()
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(current_user: CurrentUserDep, session: SessionDep) -> None:
    current_user.is_active = False
    session.commit()
