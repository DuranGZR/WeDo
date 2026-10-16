"""Verified account events and durable Apple token revocation jobs."""

import hashlib
import json
import logging
import time
from datetime import UTC, datetime, timedelta
from uuid import UUID

from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.auth import apple
from app.modules.auth.models import AppleNotification, AppleRevocation, AuthIdentity
from app.modules.auth.repository import auth_repository
from app.modules.notifications.models import DevicePushToken
from app.modules.users.deletion import deactivate_user
from app.modules.users.models import User

logger = logging.getLogger(__name__)


class AccountEvent(BaseModel):
    type: str = Field(min_length=1, max_length=100)
    sub: str = Field(min_length=1, max_length=255)
    event_time: int = Field(ge=0, strict=True)


def process_notification(session: Session, payload: str) -> None:
    claims = apple.verify_token(payload, notification=True)
    try:
        raw_event = claims["events"]
        if isinstance(raw_event, str):
            raw_event = json.loads(raw_event)
        event = AccountEvent.model_validate(raw_event)
        jti = claims["jti"]
        if (
            not isinstance(jti, str)
            or not 0 < len(jti) <= 255
            or event.event_time > time.time() + 300
        ):
            raise ValueError("Invalid event")
    except (ValueError, TypeError, KeyError, ValidationError) as error:
        raise apple.AppleInvalidToken() from error
    event_id = hashlib.sha256(jti.encode()).hexdigest()
    if session.get(AppleNotification, event_id):
        return
    session.add(AppleNotification(event_id=event_id))
    try:
        session.flush()
    except IntegrityError:
        session.rollback()  # Another worker already handled this exact event.
        return
    identity = session.scalar(
        select(AuthIdentity)
        .where(
            AuthIdentity.provider == "apple", AuthIdentity.provider_user_id == event.sub
        )
        .with_for_update()
    )
    if identity:
        if event.type in ("email-enabled", "email-disabled"):
            if (
                identity.apple_email_event_at is None
                or event.event_time > identity.apple_email_event_at
            ):
                identity.apple_email_enabled = event.type == "email-enabled"
                identity.apple_email_event_at = event.event_time
        elif event.type in ("consent-revoked", "account-deleted"):
            # Old delayed revocations must not invalidate a later Apple sign-in.
            if event.event_time >= (
                identity.apple_authorized_at or 0
            ) and event.event_time >= (identity.apple_revoked_at or 0):
                identity.apple_revoked_at = event.event_time
                identity.apple_refresh_token = None
                auth_repository.revoke_all_for_user(session, identity.user_id)
                session.execute(
                    delete(DevicePushToken).where(
                        DevicePushToken.user_id == identity.user_id
                    )
                )
                if event.type == "account-deleted":
                    user = session.get(User, identity.user_id)
                    other_identity = session.scalar(
                        select(AuthIdentity.id).where(
                            AuthIdentity.user_id == identity.user_id,
                            AuthIdentity.provider != "apple",
                        )
                    )
                    if user and not user.password_hash and not other_identity:
                        deactivate_user(session, user)
                    else:
                        session.delete(identity)
    session.commit()


def queue_revocations(session: Session, user_id: UUID) -> tuple[str, list[UUID]]:
    identities = session.scalars(
        select(AuthIdentity)
        .where(AuthIdentity.user_id == user_id, AuthIdentity.provider == "apple")
        .with_for_update()
    ).all()
    jobs = []
    manual = False
    for identity in identities:
        if identity.apple_refresh_token:
            job = AppleRevocation(
                client_id=settings.apple_bundle_id,
                encrypted_token=identity.apple_refresh_token,
            )
            session.add(job)
            session.flush()
            jobs.append(job.id)
        elif identity.apple_revoked_at is None:
            manual = True
    return ("manual" if manual else "pending" if jobs else "not_required"), jobs


def process_revocations(session: Session, job_ids: list[UUID] | None = None) -> int:
    now = datetime.now(UTC)
    query = select(AppleRevocation).where(AppleRevocation.next_attempt_at <= now)
    if job_ids is not None:
        query = query.where(AppleRevocation.id.in_(job_ids))
    jobs = session.scalars(query.with_for_update(skip_locked=True).limit(10)).all()
    completed = 0
    for job in jobs:
        try:
            apple.revoke(job.encrypted_token, job.client_id)
        except apple.AppleUnavailable:
            job.attempts += 1
            job.next_attempt_at = now + timedelta(
                seconds=min(3600, 60 * 2 ** min(job.attempts - 1, 6))
            )
            logger.warning(
                "Apple revocation pending; job=%s attempt=%s", job.id, job.attempts
            )
        else:
            session.delete(job)
            completed += 1
    session.commit()
    return completed


def attempt_revocations(session: Session, job_ids: list[UUID]) -> None:
    try:
        process_revocations(session, job_ids)
    except Exception:
        session.rollback()
        logger.error("Apple revocation attempt failed; committed jobs retained")
