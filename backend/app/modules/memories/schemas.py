from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class MemoryCreate(BaseModel):
    note: str | None = Field(default=None, max_length=5000)
    rating: int | None = Field(default=None, ge=1, le=5)
    photo_url: str | None = Field(default=None, max_length=2000)


class MemoryUpdate(MemoryCreate):
    pass


class MemoryResponse(BaseModel):
    id: UUID
    item_id: UUID
    created_by: UUID
    note: str | None
    rating: int | None
    photo_url: str | None
    created_at: datetime
    updated_at: datetime
