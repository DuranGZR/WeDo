from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import SessionDep
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.auth.schemas import (
    AppleNotificationRequest,
    AppleSignInRequest,
    ChangePasswordRequest,
    GoogleSignInRequest,
    RefreshRequest,
    ResendVerificationRequest,
    SignInRequest,
    SignOutRequest,
    SignUpRequest,
    TokenResponse,
    VerificationChallenge,
    VerifyEmailRequest,
)
from app.modules.auth.service import (
    AuthError,
    EmailAlreadyRegisteredError,
    PasswordPolicyError,
    apple_sign_in,
    change_password,
    google_sign_in,
    refresh,
    sign_in,
    sign_out,
    sign_out_all,
    sign_up,
)
from app.modules.auth.verification import resend_code, verify_code

router = APIRouter()


@router.post("/apple/notifications", status_code=200)
def apple_notification_endpoint(
    data: AppleNotificationRequest, session: SessionDep
) -> dict:
    from app.modules.auth.apple_lifecycle import process_notification

    process_notification(session, data.payload)
    return {"status": "ok"}


def _auth_error(error: AuthError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=error.args[0] if error.args else str(error),
    )


@router.post(
    "/sign-up",
    response_model=VerificationChallenge,
    status_code=status.HTTP_201_CREATED,
)
def sign_up_endpoint(data: SignUpRequest, session: SessionDep) -> dict:
    try:
        return sign_up(session, data)
    except EmailAlreadyRegisteredError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(error)
        ) from error
    except PasswordPolicyError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error
    except AuthError as error:
        raise _auth_error(error) from error


@router.post("/verify-email", status_code=204)
def verify_email_endpoint(data: VerifyEmailRequest, session: SessionDep) -> None:
    verify_code(session, data.verification_id, data.code)


@router.post("/resend-verification", response_model=VerificationChallenge)
def resend_verification_endpoint(
    data: ResendVerificationRequest, session: SessionDep
) -> dict:
    return resend_code(session, data.verification_id)


@router.post("/sign-in", response_model=TokenResponse)
def sign_in_endpoint(data: SignInRequest, session: SessionDep) -> TokenResponse:
    try:
        return sign_in(session, str(data.email), data.password, data.device_id)
    except AuthError as error:
        raise _auth_error(error) from error


@router.post("/apple", response_model=TokenResponse)
def apple_sign_in_endpoint(
    data: AppleSignInRequest, session: SessionDep
) -> TokenResponse:
    try:
        return apple_sign_in(session, data)
    except AuthError as error:
        raise _auth_error(error) from error


@router.post("/google", response_model=TokenResponse)
def google_sign_in_endpoint(
    data: GoogleSignInRequest, session: SessionDep
) -> TokenResponse:
    try:
        return google_sign_in(session, data)
    except AuthError as error:
        raise _auth_error(error) from error


@router.post("/refresh", response_model=TokenResponse)
def refresh_endpoint(data: RefreshRequest, session: SessionDep) -> TokenResponse:
    try:
        return refresh(session, data.refresh_token)
    except AuthError as error:
        raise _auth_error(error) from error


@router.post("/sign-out", status_code=status.HTTP_204_NO_CONTENT)
def sign_out_endpoint(data: SignOutRequest, session: SessionDep) -> None:
    sign_out(session, data.refresh_token)


@router.post("/sign-out-all", status_code=status.HTTP_204_NO_CONTENT)
def sign_out_all_endpoint(session: SessionDep, current_user: CurrentUserDep) -> None:
    sign_out_all(session, current_user.id)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password_endpoint(
    data: ChangePasswordRequest, session: SessionDep, current_user: CurrentUserDep
) -> None:
    try:
        change_password(session, current_user, data.current_password, data.new_password)
    except PasswordPolicyError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error
    except AuthError as error:
        raise _auth_error(error) from error
