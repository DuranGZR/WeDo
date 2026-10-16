"""Apple protocol operations. Secrets and grants never leave this boundary."""

import logging
from datetime import UTC, datetime, timedelta

import httpx
import jwt
from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings
from app.core.exceptions import AppError

logger = logging.getLogger(__name__)
APPLE_ISSUER = "https://appleid.apple.com"
jwks = jwt.PyJWKClient(f"{APPLE_ISSUER}/auth/keys", lifespan=3600, timeout=5)


class AppleUnavailable(AppError):
    status_code = 503
    code = "APPLE_UNAVAILABLE"
    default_message_key = "apple.serviceUnavailable"


class AppleInvalidToken(AppError):
    status_code = 401
    code = "APPLE_INVALID_TOKEN"
    default_message_key = "message.weCouldnTVerifyYourAppleSignInPlease"


def verify_token(token: str, *, notification: bool = False) -> dict:
    required = (
        ["iss", "aud", "iat", "jti", "events"]
        if notification
        else ["iss", "aud", "sub", "iat", "exp"]
    )
    try:
        key = jwks.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            key.key,
            algorithms=["RS256"],
            audience=settings.apple_bundle_id,
            issuer=APPLE_ISSUER,
            options={"require": required},
        )
    except jwt.PyJWKClientConnectionError as error:
        raise AppleUnavailable() from error
    except jwt.PyJWTError as error:
        raise AppleInvalidToken() from error


def cipher() -> Fernet:
    try:
        return Fernet(settings.apple_token_encryption_key.get_secret_value().encode())
    except (ValueError, TypeError) as error:
        raise AppleUnavailable() from error


def client_secret(client_id: str) -> str:
    if (
        not settings.apple_team_id
        or not settings.apple_key_id
        or not settings.apple_private_key.get_secret_value()
    ):
        raise AppleUnavailable()
    now = datetime.now(UTC)
    try:
        return jwt.encode(
            {
                "iss": settings.apple_team_id,
                "iat": now,
                "exp": now + timedelta(minutes=10),
                "aud": APPLE_ISSUER,
                "sub": client_id,
            },
            settings.apple_private_key.get_secret_value().replace("\\n", "\n"),
            algorithm="ES256",
            headers={"kid": settings.apple_key_id},
        )
    except (ValueError, TypeError, jwt.PyJWTError) as error:
        raise AppleUnavailable() from error


def post_apple(path: str, data: dict) -> httpx.Response:
    try:
        response = httpx.post(
            f"{APPLE_ISSUER}{path}", data=data, timeout=5, follow_redirects=False
        )
    except httpx.HTTPError as error:
        raise AppleUnavailable() from error
    if response.status_code >= 500 or response.status_code == 429:
        raise AppleUnavailable()
    return response


def exchange_code(code: str, subject: str) -> str:
    encryption = cipher()  # Fail before consuming a single-use authorization code.
    response = post_apple(
        "/auth/token",
        {
            "client_id": settings.apple_bundle_id,
            "client_secret": client_secret(settings.apple_bundle_id),
            "code": code,
            "grant_type": "authorization_code",
        },
    )
    if response.status_code != 200:
        try:
            error_code = response.json().get("error")
        except (ValueError, TypeError, AttributeError):
            error_code = None
        if error_code == "invalid_grant":
            raise AppleInvalidToken()
        raise AppleUnavailable()
    try:
        data = response.json()
        claims = verify_token(data["id_token"])
        token = data["refresh_token"]
        if (
            claims["sub"] != subject
            or not isinstance(token, str)
            or not 0 < len(token) <= 16384
        ):
            raise AppleInvalidToken()
        return encryption.encrypt(token.encode()).decode()
    except (KeyError, ValueError, TypeError) as error:
        raise AppleInvalidToken() from error


def revoke(encrypted_token: str, client_id: str) -> None:
    try:
        token = cipher().decrypt(encrypted_token.encode()).decode()
    except (InvalidToken, ValueError, UnicodeError) as error:
        raise AppleUnavailable() from error
    response = post_apple(
        "/auth/revoke",
        {
            "client_id": client_id,
            "client_secret": client_secret(client_id),
            "token": token,
            "token_type_hint": "refresh_token",
        },
    )
    if response.status_code != 200:
        raise AppleUnavailable()
