from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.spaces.enums import SpaceRole
from app.modules.spaces.models import Space, SpaceMember
from app.modules.spaces.repository import space_member_repository


def get_space_member(session: Session, space_id: UUID, user_id: UUID) -> SpaceMember:
    space = session.get(Space, space_id)
    if space is None or space.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alan bulunamadı.",
        )
    member = space_member_repository.get_by_space_and_user(session, space_id, user_id)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu alana erişim yetkiniz bulunmuyor.",
        )
    return member


def require_space_admin(member: SpaceMember) -> SpaceMember:
    if member.role not in {SpaceRole.OWNER, SpaceRole.ADMIN}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için yönetici yetkisi gerekiyor.",
        )
    return member
