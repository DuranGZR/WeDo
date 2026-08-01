from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.spaces.enums import SpaceRole
from app.modules.spaces.models import Space, SpaceMember
from app.modules.spaces.repository import space_member_repository, space_repository
from app.modules.spaces.schemas import SpaceCreate, SpaceResponse, SpaceUpdate


def _to_response(session: Session, space: Space) -> SpaceResponse:
    return SpaceResponse(
        id=space.id,
        name=space.name,
        type=space.type,
        created_by=space.created_by,
        created_at=space.created_at,
        updated_at=space.updated_at,
        member_count=space_repository.member_count(session, space.id),
    )


def create_space(session: Session, user_id: UUID, data: SpaceCreate) -> SpaceResponse:
    space = space_repository.create(
        session,
        Space(name=data.name.strip(), type=data.type, created_by=user_id),
    )
    space_member_repository.create(
        session,
        SpaceMember(space_id=space.id, user_id=user_id, role=SpaceRole.OWNER),
    )
    session.commit()
    return _to_response(session, space)


def list_spaces(session: Session, user_id: UUID) -> list[SpaceResponse]:
    return [
        _to_response(session, space)
        for space in space_repository.list_for_user(session, user_id)
    ]


def get_space(session: Session, space_id: UUID) -> SpaceResponse:
    space = space_repository.get_by_id(session, space_id)
    if space is None:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Alan bulunamadı."
        )
    return _to_response(session, space)


def update_space(session: Session, space_id: UUID, data: SpaceUpdate) -> SpaceResponse:
    space = space_repository.get_by_id(session, space_id)
    if space is None:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Alan bulunamadı."
        )
    if data.name is not None:
        space.name = data.name.strip()
    if data.type is not None:
        space.type = data.type
    space_repository.update(session, space)
    session.commit()
    return _to_response(session, space)


def delete_space(session: Session, space_id: UUID) -> None:
    space = space_repository.get_by_id(session, space_id)
    if space is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Alan bulunamadı.")
    from datetime import UTC, datetime

    space.deleted_at = datetime.now(UTC)
    session.commit()
