from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ListCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    icon: str | None = Field(default=None, max_length=32)
    position: int = Field(default=100, ge=0)


class ListUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    icon: str | None = Field(default=None, max_length=32)
    position: int | None = Field(default=None, ge=0)


class ListResponse(BaseModel):
    id: UUID
    space_id: UUID
    name: str
    icon: str | None
    position: int
    created_by: UUID
    is_default: bool
    created_at: datetime
    updated_at: datetime


class ListReorderRequest(BaseModel):
    list_ids: list[UUID] = Field(min_length=1)
