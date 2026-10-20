import logging
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import and_, delete, func, or_, select
from sqlalchemy.orm import Session, aliased

from app.core.config import settings
from app.core.localization import message
from app.core.mail import EmailDeliveryError, send_email
from app.modules.items.models import Item, ItemPreviewImage
from app.modules.notifications.models import Notification
from app.modules.safety.models import ContentReport, UserBlock
from app.modules.safety.schemas import BlockResponse, ReportCreate
from app.modules.spaces.enums import SpaceRole
from app.modules.spaces.models import Space, SpaceMember
from app.modules.spaces.permissions import get_space_member
from app.modules.users.models import User

logger = logging.getLogger(__name__)


def lock_users(session: Session, user_ids) -> None:
    # Use the same ordered row locks for block/unblock and accepting invitations.
    session.scalars(
        select(User)
        .where(User.id.in_(set(user_ids)))
        .order_by(User.id)
        .with_for_update()
    ).all()


def blocked_user_ids(session: Session, user_id: UUID) -> set[UUID]:
    rows = session.scalars(
        select(UserBlock).where(
            or_(UserBlock.blocker_id == user_id, UserBlock.blocked_id == user_id)
        )
    )
    return {
        row.blocked_id if row.blocker_id == user_id else row.blocker_id for row in rows
    }


def check_invitation_safety(session: Session, space_id: UUID, user_id: UUID) -> None:
    member_ids = set(
        session.scalars(
            select(SpaceMember.user_id).where(
                SpaceMember.space_id == space_id, SpaceMember.removed_at.is_(None)
            )
        )
    )
    lock_users(session, member_ids | {user_id})
    # Another invitation may have added a member while these locks were pending.
    # Check the current membership, not the pre-lock snapshot.
    member_ids = set(
        session.scalars(
            select(SpaceMember.user_id).where(
                SpaceMember.space_id == space_id, SpaceMember.removed_at.is_(None)
            )
        )
    )
    if member_ids & blocked_user_ids(session, user_id):
        raise HTTPException(status_code=403, detail=message("safety.sharingBlocked"))


def _shared_space_ids(session: Session, first: UUID, second: UUID) -> list[UUID]:
    other = aliased(SpaceMember)
    return list(
        session.scalars(
            select(SpaceMember.space_id)
            .join(other, other.space_id == SpaceMember.space_id)
            .join(Space, Space.id == SpaceMember.space_id)
            .where(
                SpaceMember.user_id == first,
                other.user_id == second,
                SpaceMember.removed_at.is_(None),
                other.removed_at.is_(None),
                Space.deleted_at.is_(None),
            )
        )
    )


def block_user(session: Session, user_id: UUID, target_id: UUID) -> UserBlock:
    if user_id == target_id:
        raise HTTPException(status_code=400, detail=message("safety.cannotBlockSelf"))
    lock_users(session, (user_id, target_id))
    existing = session.scalar(
        select(UserBlock).where(
            UserBlock.blocker_id == user_id, UserBlock.blocked_id == target_id
        )
    )
    if existing:
        return existing
    target = session.get(User, target_id)
    spaces = _shared_space_ids(session, user_id, target_id)
    # Do not offer a user-directory/UUID oracle: only current co-members can be blocked.
    if not target or not target.is_active or not spaces:
        raise HTTPException(status_code=404, detail=message("safety.userUnavailable"))
    now = datetime.now(UTC)
    for space_id in spaces:
        mine = get_space_member(session, space_id, user_id)
        removed = (
            get_space_member(session, space_id, target_id)
            if mine.role == SpaceRole.OWNER
            else mine
        )
        removed.removed_at = now
        session.execute(
            delete(Notification).where(
                Notification.space_id == space_id,
                Notification.user_id == removed.user_id,
            )
        )
    session.execute(
        delete(Notification).where(
            or_(
                and_(
                    Notification.user_id == user_id, Notification.actor_id == target_id
                ),
                and_(
                    Notification.user_id == target_id, Notification.actor_id == user_id
                ),
            )
        )
    )
    block = UserBlock(blocker_id=user_id, blocked_id=target_id)
    session.add(block)
    session.commit()
    session.refresh(block)
    return block


def list_blocks(session: Session, user_id: UUID) -> list[BlockResponse]:
    rows = session.execute(
        select(UserBlock, User)
        .join(User, User.id == UserBlock.blocked_id)
        .where(UserBlock.blocker_id == user_id)
        .order_by(UserBlock.created_at.desc())
    )
    return [
        BlockResponse(
            user_id=user.id,
            display_name=user.display_name
            if user.is_active
            else message("message.deletedUser"),
            created_at=block.created_at,
        )
        for block, user in rows
    ]


def unblock_user(session: Session, user_id: UUID, target_id: UUID) -> None:
    lock_users(session, (user_id, target_id))
    session.execute(
        delete(UserBlock).where(
            UserBlock.blocker_id == user_id, UserBlock.blocked_id == target_id
        )
    )
    session.commit()


def create_report(session: Session, user_id: UUID, data: ReportCreate) -> ContentReport:
    # Serialize per-account quota and duplicate checks, including concurrent requests.
    lock_users(session, (user_id,))
    space_id = data.space_id
    subject_id = None
    snapshot = {}
    if data.target_type == "item":
        item = session.get(Item, data.target_id)
        if item is None or item.deleted_at is not None:
            raise HTTPException(status_code=404, detail=message("message.itemNotFound"))
        get_space_member(session, item.space_id, user_id)
        if space_id is not None and space_id != item.space_id:
            raise HTTPException(status_code=400, detail=message("safety.invalidTarget"))
        space_id, subject_id = item.space_id, item.created_by
        snapshot = {
            "title": item.title,
            "url": item.original_url,
            "description": (item.description or "")[:4000],
            "preview_image_url": item.preview_image_url,
            "text": (item.shared_text or "")[:4000],
        }
    elif data.target_type == "user":
        if data.target_id == user_id:
            raise HTTPException(status_code=400, detail=message("safety.invalidTarget"))
        spaces = _shared_space_ids(session, user_id, data.target_id)
        if not spaces or (space_id is not None and space_id not in spaces):
            raise HTTPException(
                status_code=404, detail=message("safety.userUnavailable")
            )
        space_id = space_id or spaces[0]
        subject_id = data.target_id
    elif space_id is not None:
        get_space_member(session, space_id, user_id)
    if data.target_id is not None:
        existing = session.scalar(
            select(ContentReport).where(
                ContentReport.reporter_id == user_id,
                ContentReport.target_type == data.target_type,
                ContentReport.target_id == data.target_id,
                ContentReport.status == "pending",
            )
        )
        if existing:
            return existing
    count = (
        session.scalar(
            select(func.count())
            .select_from(ContentReport)
            .where(
                ContentReport.reporter_id == user_id,
                ContentReport.created_at >= datetime.now(UTC) - timedelta(days=1),
            )
        )
        or 0
    )
    if count >= 20:
        raise HTTPException(status_code=429, detail=message("safety.reportLimit"))
    report = ContentReport(
        reporter_id=user_id,
        target_type=data.target_type,
        target_id=data.target_id,
        subject_user_id=subject_id,
        space_id=space_id,
        reason=data.reason,
        details=data.details,
        snapshot=snapshot,
    )
    session.add(report)
    session.commit()
    session.refresh(report)
    return report


def notify_report(session: Session, report_id: UUID) -> bool:
    report = session.get(ContentReport, report_id)
    if not report or report.notified_at is not None:
        return True
    try:
        send_email(
            to=str(settings.moderation_email),
            subject=f"WeDo safety report {report.id}",
            text=(
                f"Report: {report.id}\nReason: {report.reason}\n"
                f"Target: {report.target_type} {report.target_id}\n"
                f"Details:\n{report.details}\n\nReview the stored report in the "
                "moderation CLI. Do not reply to the reported user."
            ),
        )
    except EmailDeliveryError:
        logger.warning("Safety report %s saved; email delivery pending", report.id)
        return False
    report.notified_at = datetime.now(UTC)
    session.commit()
    return True


def remove_reported_item(session: Session, report: ContentReport) -> None:
    if report.target_type != "item":
        raise ValueError("This report does not target an item")
    item = session.get(Item, report.target_id)
    if item:
        item.deleted_at = datetime.now(UTC)
        session.execute(
            delete(ItemPreviewImage).where(ItemPreviewImage.item_id == item.id)
        )
