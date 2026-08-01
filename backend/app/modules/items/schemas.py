from datetime import datetime
from uuid import UUID

from pydantic import AnyHttpUrl, BaseModel, Field

from app.modules.items.enums import ItemStatus, ItemType, MetadataStatus


class ItemCreate(BaseModel):
    space_id: UUID
    list_id: UUID
    original_url: AnyHttpUrl | None = None
    shared_text: str | None = Field(default=None, max_length=10_000)
    source_app: str | None = Field(default=None, max_length=255)
    source_external_id: str | None = Field(default=None, max_length=255)
    client_item_id: str | None = Field(default=None, max_length=255)
    title: str | None = Field(default=None, max_length=255)
    item_type: ItemType = ItemType.URL


class ItemUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=10_000)


class ItemMove(BaseModel):
    list_id: UUID


class ItemResponse(BaseModel):
    id: UUID
    space_id: UUID
    list_id: UUID
    created_by: UUID
    created_by_name: str = "Bilinmeyen kullanıcı"
    client_item_id: str | None
    type: ItemType
    status: ItemStatus
    title: str | None
    description: str | None
    original_url: str | None
    canonical_url: str | None
    preview_image_url: str | None
    source_domain: str | None
    source_app: str | None
    shared_text: str | None
    metadata_status: MetadataStatus
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
