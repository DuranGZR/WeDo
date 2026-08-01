from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import SessionDep
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.members.schemas import MemberRoleUpdate
from app.modules.spaces.dependencies import SpaceMemberDep
from app.modules.spaces.enums import SpaceRole
from app.modules.spaces.models import SpaceMember
from app.modules.spaces.permissions import get_space_member, require_space_admin

router = APIRouter()


def _member(session: SessionDep, member_id: UUID) -> SpaceMember:
    member = session.get(SpaceMember, member_id)
    if member is None or member.removed_at is not None:
        raise HTTPException(status_code=404, detail="Üye bulunamadı.")
    return member


@router.patch("/spaces/{space_id}/members/{member_id}", response_model=dict)
def update_member_role(
    space_id: UUID,
    member_id: UUID,
    data: MemberRoleUpdate,
    session: SessionDep,
    admin: SpaceMemberDep,
) -> dict:
    require_space_admin(admin)
    member = _member(session, member_id)
    if (
        member.space_id != space_id
        or member.role == SpaceRole.OWNER
        or data.role == SpaceRole.OWNER
    ):
        raise HTTPException(status_code=400, detail="Bu üyenin rolü değiştirilemez.")
    member.role = data.role
    session.commit()
    return {"id": str(member.id), "user_id": str(member.user_id), "role": member.role}


@router.delete(
    "/spaces/{space_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT
)
def remove_member(
    space_id: UUID, member_id: UUID, session: SessionDep, admin: SpaceMemberDep
) -> None:
    require_space_admin(admin)
    member = _member(session, member_id)
    if member.space_id != space_id or member.role == SpaceRole.OWNER:
        raise HTTPException(status_code=400, detail="Bu üye çıkarılamaz.")
    member.removed_at = datetime.now(UTC)
    session.commit()


@router.post("/spaces/{space_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_space(
    space_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> None:
    member = get_space_member(session, space_id, current_user.id)
    if member.role == SpaceRole.OWNER:
        raise HTTPException(status_code=400, detail="Alan sahibi alanı silebilir.")
    member.removed_at = datetime.now(UTC)
    session.commit()
