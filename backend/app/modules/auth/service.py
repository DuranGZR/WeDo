from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.auth.models import AuthIdentity, RefreshSession
from app.modules.auth.passwords import hash_password, verify_password
from app.modules.auth.repository import auth_repository
from app.modules.auth.schemas import SignUpRequest, TokenResponse
from app.modules.auth.tokens import create_token, decode_token, hash_token
from app.modules.users.models import User
from app.modules.users.repository import user_repository
from app.modules.users.schemas import UserResponse


class AuthError(Exception):
    """Expected authentication failure."""


class EmailAlreadyRegisteredError(AuthError):
    """Raised when sign-up conflicts with an existing account."""


def _is_expired(expires_at: datetime) -> bool:
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    return expires_at <= datetime.now(UTC)


def _issue_tokens(session: Session, user: User, device_id: str | None) -> TokenResponse:
    session_id = uuid4()
    refresh_token = create_token(
        user_id=user.id,
        session_id=session_id,
        token_type="refresh",
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
    )
    refresh_session = RefreshSession(
        id=session_id,
        user_id=user.id,
        device_id=device_id,
        refresh_token_hash=hash_token(refresh_token),
        expires_at=datetime.now(UTC)
        + timedelta(days=settings.refresh_token_expire_days),
    )
    auth_repository.create_refresh_session(session, refresh_session)
    access_token = create_token(
        user_id=user.id,
        session_id=session_id,
        token_type="access",
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


def sign_up(session: Session, data: SignUpRequest) -> TokenResponse:
    email = str(data.email).lower()
    if user_repository.get_by_email(session, email):
        raise EmailAlreadyRegisteredError(
            "Bu e-posta adresiyle zaten bir hesap var."
        )
    user = user_repository.create(
        session,
        User(
            email=email,
            display_name=data.display_name.strip(),
            password_hash=hash_password(data.password),
        ),
    )
    auth_repository.create_identity(
        session,
        AuthIdentity(
            user_id=user.id,
            provider="email",
            provider_user_id=email,
            provider_email=email,
        ),
    )
    response = _issue_tokens(session, user, data.device_id)
    session.commit()
    return response


def sign_in(
    session: Session, email: str, password: str, device_id: str | None
) -> TokenResponse:
    user = user_repository.get_by_email(session, email.lower())
    if (
        user is None
        or user.password_hash is None
        or not verify_password(password, user.password_hash)
    ):
        raise AuthError("E-posta veya şifre hatalı.")
    if not user.is_active:
        raise AuthError("Kullanıcı hesabı aktif değil.")
    response = _issue_tokens(session, user, device_id)
    session.commit()
    return response


def refresh(session: Session, refresh_token: str) -> TokenResponse:
    try:
        payload = decode_token(refresh_token, "refresh")
        session_id = UUID(payload["session_id"])
        user_id = UUID(payload["sub"])
    except (ValueError, KeyError, jwt.InvalidTokenError) as error:
        raise AuthError("Refresh token geçersiz.") from error
    refresh_session = auth_repository.get_refresh_session(session, session_id)
    user = user_repository.get_by_id(session, user_id)
    if (
        refresh_session is None
        or user is None
        or refresh_session.user_id != user.id
        or refresh_session.revoked_at is not None
        or _is_expired(refresh_session.expires_at)
        or refresh_session.refresh_token_hash != hash_token(refresh_token)
    ):
        raise AuthError("Refresh token geçersiz veya süresi dolmuş.")
    auth_repository.revoke_refresh_session(refresh_session)
    response = _issue_tokens(session, user, refresh_session.device_id)
    session.commit()
    return response


def sign_out(session: Session, refresh_token: str) -> None:
    try:
        payload = decode_token(refresh_token, "refresh")
        refresh_session = auth_repository.get_refresh_session(
            session, UUID(payload["session_id"])
        )
    except (ValueError, KeyError, jwt.InvalidTokenError):
        return
    if refresh_session and refresh_session.refresh_token_hash == hash_token(
        refresh_token
    ):
        auth_repository.revoke_refresh_session(refresh_session)
        session.commit()


def sign_out_all(session: Session, user_id: UUID) -> None:
    auth_repository.revoke_all_for_user(session, user_id)
    session.commit()
