import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AppError
from app.core.localization import message
from app.core.mail import EmailDeliveryError, send_email
from app.modules.auth.models import EmailVerification
from app.modules.users.models import User

TTL_SECONDS = 600
RESEND_SECONDS = 60
MAX_ATTEMPTS = 5


class VerificationError(AppError):
    status_code = 400
    code = "INVALID_VERIFICATION"
    default_message_key = "message.thisCodeIsInvalidOrHasExpiredRequestA"


class VerificationRequired(AppError):
    status_code = 403
    code = "EMAIL_VERIFICATION_REQUIRED"
    default_message_key = "message.verifyYourEmailToSignIn"


class VerificationMailError(AppError):
    status_code = 503
    code = "EMAIL_DELIVERY_FAILED"
    default_message_key = "message.weCouldnTSendYourVerificationCodePleaseTry"


def _utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value


def _hash(challenge_id: UUID, code: str) -> str:
    return hmac.new(
        settings.jwt_secret_key.encode(),
        f"{challenge_id}:{code}".encode(),
        hashlib.sha256,
    ).hexdigest()


def challenge_response(challenge: EmailVerification, user: User) -> dict:
    now = datetime.now(UTC)
    return {
        "verification_id": str(challenge.id),
        "email": user.email,
        "expires_in_seconds": max(
            0, int((_utc(challenge.expires_at) - now).total_seconds())
        ),
        "resend_after_seconds": max(
            0, RESEND_SECONDS - int((now - _utc(challenge.sent_at)).total_seconds())
        ),
    }


def issue_code(session: Session, user: User) -> dict:
    # Callers serialize issuance using the user's row before entering here.
    challenge = session.scalar(
        select(EmailVerification).where(EmailVerification.user_id == user.id)
    )
    now = datetime.now(UTC)
    if challenge and (now - _utc(challenge.sent_at)).total_seconds() < RESEND_SECONDS:
        return challenge_response(challenge, user)
    code = f"{secrets.randbelow(1_000_000):06d}"
    if challenge is None:
        challenge = EmailVerification(id=uuid4(), user_id=user.id)
        session.add(challenge)
    challenge.code_hash = _hash(challenge.id, code)
    challenge.expires_at = now + timedelta(seconds=TTL_SECONDS)
    challenge.sent_at = now
    challenge.attempts = 0
    try:
        send_email(
            to=user.email,
            subject=message(
                "message.yourWedoEmailVerificationCode",
                language=user.preferred_language,
            ),
            text=message(
                "message.yourWedoVerificationCodeValue0ThisCodeIsValid",
                value0=code,
                language=user.preferred_language,
            ),
        )
        session.flush()
    except EmailDeliveryError as error:
        session.rollback()
        raise VerificationMailError() from error
    return challenge_response(challenge, user)


def _locked_user(session: Session, challenge_id: UUID) -> User:
    user_id = session.scalar(
        select(EmailVerification.user_id).where(EmailVerification.id == challenge_id)
    )
    user = session.scalar(select(User).where(User.id == user_id).with_for_update())
    if not user or not user.is_active or user.email_verified:
        raise VerificationError()
    return user


def resend_code(session: Session, challenge_id: UUID) -> dict:
    user = _locked_user(session, challenge_id)
    result = issue_code(session, user)
    session.commit()
    return result


def verify_code(session: Session, challenge_id: UUID, code: str) -> None:
    user = _locked_user(session, challenge_id)
    challenge = session.scalar(
        select(EmailVerification)
        .where(EmailVerification.id == challenge_id)
        .execution_options(populate_existing=True)
    )
    if not challenge or _utc(challenge.expires_at) <= datetime.now(UTC):
        raise VerificationError()
    if challenge.attempts >= MAX_ATTEMPTS:
        raise VerificationError(
            message("message.tooManyIncorrectAttemptsRequestANewCode")
        )
    if not hmac.compare_digest(challenge.code_hash, _hash(challenge.id, code)):
        challenge.attempts += 1
        session.commit()
        raise VerificationError()
    user.email_verified = True
    session.delete(challenge)
    # Verification does not log in; the user must also supply their password.
    session.commit()
