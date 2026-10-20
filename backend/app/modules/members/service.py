from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.localization import message
from app.modules.notifications.models import Notification
from app.modules.safety.service import lock_users
from app.modules.spaces.enums import SpaceRole
from app.modules.spaces.models import Space, SpaceMember
from app.modules.spaces.permissions import get_space_member
from app.modules.users.models import User


def leave_space(
    session: Session,
    space_id: UUID,
    user_id: UUID,
    successor_user_id: UUID | None = None,
) -> None:
    member_ids = session.scalars(
        select(SpaceMember.user_id).where(
            SpaceMember.space_id == space_id, SpaceMember.removed_at.is_(None)
        )
    ).all()
    # Coordinate with invitation acceptance and blocking, then serialize departures.
    lock_users(session, [*member_ids, user_id])
    space = session.scalar(select(Space).where(Space.id == space_id).with_for_update())
    member = get_space_member(session, space_id, user_id)
    now = datetime.now(UTC)
    if member.role == SpaceRole.OWNER:
        eligible = session.scalars(
            select(SpaceMember)
            .join(User, User.id == SpaceMember.user_id)
            .where(
                SpaceMember.space_id == space_id,
                SpaceMember.user_id != user_id,
                SpaceMember.removed_at.is_(None),
                User.is_active.is_(True),
            )
        ).all()
        if eligible:
            successor = next(
                (entry for entry in eligible if entry.user_id == successor_user_id),
                None,
            )
            if successor is None:
                raise HTTPException(
                    status_code=400, detail=message("members.chooseSuccessor")
                )
            successor.role = SpaceRole.OWNER
        else:
            if successor_user_id is not None:
                raise HTTPException(
                    status_code=400, detail=message("members.chooseSuccessor")
                )
            space.deleted_at = now
    elif successor_user_id is not None:
        raise HTTPException(
            status_code=400, detail=message("members.onlyOwnerTransfers")
        )
    member.removed_at = now
    # Historical data stays in the space; no account or other membership is blocked.
    session.execute(
        delete(Notification).where(
            Notification.space_id == space_id, Notification.user_id == user_id
        )
    )
    session.commit()
