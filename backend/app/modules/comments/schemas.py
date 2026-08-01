from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=1000)


class CommentUpdate(BaseModel):
    body: str = Field(min_length=1, max_length=1000)


class CommentResponse(BaseModel):
    id: UUID
    item_id: UUID
    user_id: UUID
    body: str
    created_at: datetime
    updated_at: datetime
