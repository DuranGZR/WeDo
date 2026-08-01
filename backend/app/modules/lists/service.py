from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.lists.models import SpaceList
from app.modules.lists.repository import list_repository
from app.modules.lists.schemas import (
    ListCreate,
    ListReorderRequest,
    ListResponse,
    ListUpdate,
)


def normalize_name(name: str) -> str:
    return " ".join(name.strip().casefold().split())


def _response(item: SpaceList) -> ListResponse:
    return ListResponse.model_validate(item, from_attributes=True)


def create_list(
    session: Session, space_id: UUID, user_id: UUID, data: ListCreate
) -> ListResponse:
    normalized_name = normalize_name(data.name)
    if list_repository.get_by_space_and_name(session, space_id, normalized_name):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu isimde bir liste zaten var.",
        )
    item = list_repository.create(
        session,
        SpaceList(
            space_id=space_id,
            name=data.name.strip(),
            normalized_name=normalized_name,
            icon=data.icon,
            position=data.position,
            created_by=user_id,
        ),
    )
    session.commit()
    return _response(item)


def list_lists(session: Session, space_id: UUID) -> list[ListResponse]:
    return [
        _response(item) for item in list_repository.list_for_space(session, space_id)
    ]


def get_list(session: Session, list_id: UUID) -> SpaceList:
    item = list_repository.get_by_id(session, list_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Liste bulunamadı."
        )
    return item


def update_list(session: Session, list_id: UUID, data: ListUpdate) -> ListResponse:
    item = get_list(session, list_id)
    if data.name is not None:
        normalized_name = normalize_name(data.name)
        duplicate = list_repository.get_by_space_and_name(
            session, item.space_id, normalized_name
        )
        if duplicate and duplicate.id != item.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Bu isimde bir liste zaten var.",
            )
        item.name = data.name.strip()
        item.normalized_name = normalized_name
    if data.icon is not None:
        item.icon = data.icon
    if data.position is not None:
        item.position = data.position
    session.commit()
    return _response(item)


def delete_list(session: Session, list_id: UUID) -> None:
    item = get_list(session, list_id)
    item.deleted_at = datetime.now(UTC)
    session.commit()


def reorder_lists(
    session: Session, space_id: UUID, data: ListReorderRequest
) -> list[ListResponse]:
    items = list_repository.list_for_space(session, space_id)
    by_id = {item.id: item for item in items}
    if set(by_id) != set(data.list_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Liste sıralaması alanla eşleşmiyor.",
        )
    for position, list_id in enumerate(data.list_ids, start=1):
        by_id[list_id].position = position * 100
    session.commit()
    return list_lists(session, space_id)
