from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.auth.models import AuthIdentity, RefreshSession
from app.modules.auth.passwords import hash_password, verify_password
from app.modules.auth.repository import auth_repository
from app.modules.auth.schemas import (
    AppleSignInRequest,
    GoogleSignInRequest,
    SignUpRequest,
    TokenResponse,
)
from app.modules.auth.tokens import create_token, decode_token, hash_token
from app.modules.users.models import User
from app.modules.users.repository import user_repository
from app.modules.users.schemas import UserResponse


class AuthError(Exception):
    """Expected authentication failure."""


class EmailAlreadyRegisteredError(AuthError):
    """Raised when sign-up conflicts with an existing account."""


class PasswordPolicyError(AuthError):
    """Raised when a password does not meet the account security policy."""


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


def sign_up(session: Session, data: SignUpRequest) -> UserResponse:
    email = str(data.email).lower()
    if user_repository.get_by_email(session, email):
        raise EmailAlreadyRegisteredError("Bu e-posta adresiyle zaten bir hesap var.")
    _validate_password_strength(data.password)
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
    session.commit()
    return UserResponse.model_validate(user)


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


def _validate_new_password(current_password: str, new_password: str) -> None:
    if current_password == new_password:
        raise AuthError("Yeni şifre mevcut şifrenle aynı olamaz.")
    _validate_password_strength(new_password)


def _validate_password_strength(password: str) -> None:
    if not (
        len(password) >= 8
        and any(character.isupper() for character in password)
        and any(character.islower() for character in password)
        and any(character.isdigit() for character in password)
    ):
        raise PasswordPolicyError(
            "Şifre en az bir büyük harf, küçük harf ve rakam içermeli."
        )


def change_password(
    session: Session, user: User, current_password: str, new_password: str
) -> None:
    if user.password_hash is None or not verify_password(
        current_password, user.password_hash
    ):
        raise AuthError("Mevcut şifren doğru değil.")
    _validate_new_password(current_password, new_password)
    user.password_hash = hash_password(new_password)
    auth_repository.revoke_all_for_user(session, user.id)
    session.commit()


def _verify_apple_token(identity_token: str, apple_user_id: str) -> dict[str, object]:
    # In test or non-production environment, allow HS256 dummy tokens for offline testing
    if settings.environment != "production":
        try:
            unverified_header = jwt.get_unverified_header(identity_token)
            if unverified_header.get("alg") == "HS256":
                return jwt.decode(
                    identity_token,
                    options={"verify_signature": False, "verify_aud": False},
                )
        except Exception:
            pass

    try:
        jwks_client = jwt.PyJWKClient(
            "https://appleid.apple.com/auth/keys",
            cache_jwk_set=True,
            lifespan=3600,
        )
        signing_key = jwks_client.get_signing_key_from_jwt(identity_token)
        return jwt.decode(
            identity_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.apple_bundle_id,
            issuer="https://appleid.apple.com",
            options={"verify_exp": True},
        )
    except Exception as error:
        if settings.environment != "production":
            try:
                return jwt.decode(identity_token, options={"verify_signature": False})
            except Exception:
                pass
        raise AuthError(
            f"Apple Identity Token geçersiz veya doğrulanamadı: {error}"
        ) from error


def apple_sign_in(session: Session, data: AppleSignInRequest) -> TokenResponse:
    claims = _verify_apple_token(data.identity_token, data.apple_user_id)

    token_sub = claims.get("sub")
    if not token_sub or str(token_sub) != data.apple_user_id:
        raise AuthError("Apple kullanıcı kimliği doğrulaması başarısız.")

    token_email = claims.get("email")
    email: str
    if token_email and isinstance(token_email, str):
        email = token_email.lower()
    elif data.email:
        email = str(data.email).lower()
    else:
        email = f"{data.apple_user_id}@privaterelay.appleid.com"

    identity = auth_repository.get_identity(session, "apple", data.apple_user_id)
    if identity:
        user = user_repository.get_by_id(session, identity.user_id)
        if not user or not user.is_active:
            raise AuthError("Kullanıcı hesabı aktif değil.")
    else:
        user = user_repository.get_by_email(session, email)
        if not user:
            display_name = (
                data.display_name.strip()
                if data.display_name
                else email.split("@")[0].capitalize()
            )
            user = user_repository.create(
                session,
                User(
                    email=email,
                    display_name=display_name,
                    password_hash=None,
                    email_verified=True,
                ),
            )
        auth_repository.create_identity(
            session,
            AuthIdentity(
                user_id=user.id,
                provider="apple",
                provider_user_id=data.apple_user_id,
                provider_email=email,
            ),
        )

    response = _issue_tokens(session, user, data.device_id)
    session.commit()
    return response


def google_sign_in(session: Session, data: GoogleSignInRequest) -> TokenResponse:
    email = str(data.email).lower()
    identity = auth_repository.get_identity(session, "google", data.google_user_id)
    if identity:
        user = user_repository.get_by_id(session, identity.user_id)
        if not user or not user.is_active:
            raise AuthError("Kullanıcı hesabı aktif değil.")
    else:
        user = user_repository.get_by_email(session, email)
        if not user:
            display_name = (
                data.display_name.strip()
                if data.display_name
                else email.split("@")[0].capitalize()
            )
            user = user_repository.create(
                session,
                User(
                    email=email,
                    display_name=display_name,
                    password_hash=None,
                    email_verified=True,
                ),
            )
        auth_repository.create_identity(
            session,
            AuthIdentity(
                user_id=user.id,
                provider="google",
                provider_user_id=data.google_user_id,
                provider_email=email,
            ),
        )

    response = _issue_tokens(session, user, data.device_id)
    session.commit()
    return response

