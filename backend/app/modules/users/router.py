from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import SessionDep
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.auth.passwords import verify_password
from app.modules.auth.repository import auth_repository
from app.modules.users.schemas import AccountDeleteRequest, UserResponse, UserUpdate

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
    if data.notify_partner_activity is not None:
        current_user.notify_partner_activity = data.notify_partner_activity
    if data.push_notifications_enabled is not None:
        current_user.push_notifications_enabled = data.push_notifications_enabled
    session.commit()
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(
    data: AccountDeleteRequest, current_user: CurrentUserDep, session: SessionDep
) -> None:
    if current_user.password_hash is None or not verify_password(
        data.current_password, current_user.password_hash
    ):
        raise HTTPException(status_code=401, detail="Mevcut şifren doğru değil.")
    current_user.is_active = False
    auth_repository.revoke_all_for_user(session, current_user.id)
    session.commit()
