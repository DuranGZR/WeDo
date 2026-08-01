from datetime import UTC, datetime
from urllib.parse import urlsplit
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.items.enums import ItemStatus, MetadataStatus
from app.modules.items.models import Item
from app.modules.items.repository import item_repository
from app.modules.items.schemas import ItemCreate, ItemMove, ItemResponse, ItemUpdate
from app.modules.items.validators import url_hash
from app.modules.lists.repository import list_repository
from app.modules.notifications.service import (
    dispatch_pending_pushes,
    notify_space_members,
)
from app.modules.users.models import User


def response_for_item(session: Session, item: Item) -> ItemResponse:
    creator = session.get(User, item.created_by)
    response = ItemResponse.model_validate(item, from_attributes=True)
    return response.model_copy(
        update={
            "created_by_name": (
                creator.display_name if creator else "Bilinmeyen kullanıcı"
            )
        }
    )


def create_item(session: Session, user_id: UUID, data: ItemCreate) -> ItemResponse:
    target_list = list_repository.get_by_id(session, data.list_id)
    if target_list is None or target_list.space_id != data.space_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Liste bulunamadı."
        )
    if data.client_item_id and item_repository.get_by_client_id(
        session, user_id, data.client_item_id
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu paylaşım daha önce kaydedildi.",
        )
    original_url = str(data.original_url) if data.original_url else None
    normalized_hash = url_hash(original_url) if original_url else None
    if normalized_hash and item_repository.get_duplicate_url(
        session, data.list_id, normalized_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu bağlantı listede zaten bulunuyor.",
        )
    item = item_repository.create(
        session,
        Item(
            space_id=data.space_id,
            list_id=data.list_id,
            created_by=user_id,
            client_item_id=data.client_item_id,
            type=data.item_type,
            title=data.title,
            original_url=original_url,
            normalized_url_hash=normalized_hash,
            source_domain=urlsplit(original_url).netloc if original_url else None,
            source_app=data.source_app,
            source_external_id=data.source_external_id,
            shared_text=data.shared_text,
            metadata_status=MetadataStatus.PENDING
            if original_url
            else MetadataStatus.NOT_AVAILABLE,
        ),
    )
    notify_space_members(
        session,
        space_id=item.space_id,
        actor_id=user_id,
        notification_type="item_created",
        title="Yeni içerik kaydedildi",
        body="Ortak alana yeni bir içerik eklendi.",
        data={"item_id": str(item.id), "space_id": str(item.space_id)},
    )
    session.commit()
    dispatch_pending_pushes(session)
    return response_for_item(session, item)


def get_item(session: Session, item_id: UUID) -> Item:
    item = item_repository.get_by_id(session, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Öğe bulunamadı.")
    return item


def list_items(session: Session, list_id: UUID) -> list[ItemResponse]:
    return [
        response_for_item(session, item)
        for item in item_repository.list_for_list(session, list_id)
    ]


def update_item(session: Session, item_id: UUID, data: ItemUpdate) -> ItemResponse:
    item = get_item(session, item_id)
    if data.title is not None:
        item.title = data.title.strip()
    if data.description is not None:
        item.description = data.description
    session.commit()
    return response_for_item(session, item)


def move_item(session: Session, item_id: UUID, data: ItemMove) -> ItemResponse:
    item = get_item(session, item_id)
    target_list = list_repository.get_by_id(session, data.list_id)
    if target_list is None or target_list.space_id != item.space_id:
        raise HTTPException(status_code=404, detail="Hedef liste bulunamadı.")
    item.list_id = data.list_id
    session.commit()
    return response_for_item(session, item)


def delete_item(session: Session, item_id: UUID) -> None:
    item = get_item(session, item_id)
    item.deleted_at = datetime.now(UTC)
    session.commit()


def complete_item(session: Session, item_id: UUID) -> ItemResponse:
    item = get_item(session, item_id)
    item.status = ItemStatus.COMPLETED
    item.completed_at = datetime.now(UTC)
    session.commit()
    return response_for_item(session, item)


def restore_item(session: Session, item_id: UUID) -> ItemResponse:
    item = get_item(session, item_id)
    item.status = ItemStatus.NEW
    item.completed_at = None
    session.commit()
    return response_for_item(session, item)
