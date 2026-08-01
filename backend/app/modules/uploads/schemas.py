from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class PresignRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(pattern="^image/(jpeg|png|webp)$")
    size_bytes: int = Field(gt=0, le=10 * 1024 * 1024)


class PresignResponse(BaseModel):
    upload_id: UUID
    object_key: str
    upload_url: str
    expires_in: int


class UploadCompleteRequest(BaseModel):
    upload_id: UUID


class UploadCompleteResponse(BaseModel):
    id: UUID
    object_key: str
    status: str
    created_at: datetime
