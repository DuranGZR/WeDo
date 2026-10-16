from fastapi import APIRouter, BackgroundTasks, HTTPException
from sqlalchemy import select

from app.api.dependencies import SessionDep
from app.core.localization import message
from app.modules.auth.apple_lifecycle import attempt_revocations, queue_revocations
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.auth.models import AuthIdentity
from app.modules.auth.passwords import verify_password
from app.modules.users.deletion import deactivate_user
from app.modules.users.schemas import (
    AccountDeleteRequest,
    AccountDeletionResponse,
    UserResponse,
    UserUpdate,
)

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_current_user(current_user: CurrentUserDep, session: SessionDep) -> UserResponse:
    forwarding = session.scalar(
        select(AuthIdentity.apple_email_enabled).where(
            AuthIdentity.user_id == current_user.id, AuthIdentity.provider == "apple"
        )
    )
    return UserResponse.model_validate(current_user).model_copy(
        update={"apple_email_forwarding_enabled": forwarding}
    )


@router.patch("/me", response_model=UserResponse)
def update_current_user(
    data: UserUpdate, current_user: CurrentUserDep, session: SessionDep
) -> UserResponse:
    if data.preferred_language is not None:
        current_user.preferred_language = data.preferred_language
    if data.display_name is not None:
        current_user.display_name = data.display_name.strip()
    if data.notify_partner_activity is not None:
        current_user.notify_partner_activity = data.notify_partner_activity
    if data.push_notifications_enabled is not None:
        current_user.push_notifications_enabled = data.push_notifications_enabled
    session.commit()
    return get_current_user(current_user, session)


@router.delete("/me", response_model=AccountDeletionResponse)
def delete_current_user(
    data: AccountDeleteRequest,
    current_user: CurrentUserDep,
    session: SessionDep,
    background_tasks: BackgroundTasks,
) -> AccountDeletionResponse:
    if current_user.password_hash is not None:
        if not data.current_password or not verify_password(
            data.current_password, current_user.password_hash
        ):
            raise HTTPException(
                status_code=401,
                detail=message("message.yourCurrentPasswordIsIncorrect"),
            )
    revocation, job_ids = queue_revocations(session, current_user.id)
    deactivate_user(session, current_user)
    session.commit()
    if job_ids:
        background_tasks.add_task(attempt_revocations, session, job_ids)
    return AccountDeletionResponse(apple_revocation=revocation)
