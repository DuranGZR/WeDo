from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.integrations.storage.presigned_urls import create_presigned_put_url
from app.modules.uploads.models import Upload
from app.modules.uploads.schemas import (
    PresignRequest,
    PresignResponse,
    UploadCompleteResponse,
)


def create_presigned_upload(
    session: Session, user_id: UUID, data: PresignRequest
) -> PresignResponse:
    extension = data.content_type.split("/", 1)[1]
    upload_id = uuid4()
    object_key = f"users/{user_id}/uploads/{upload_id}.{extension}"
    upload = Upload(
        id=upload_id,
        user_id=user_id,
        object_key=object_key,
        content_type=data.content_type,
        size_bytes=data.size_bytes,
    )
    session.add(upload)
    session.commit()
    upload_url = create_presigned_put_url(object_key, data.content_type)
    if upload_url is None:
        base_url = settings.storage_endpoint or "http://localhost:8000/uploads/storage"
        upload_url = f"{base_url}/{object_key}"
    return PresignResponse(
        upload_id=upload_id,
        object_key=object_key,
        upload_url=upload_url,
        expires_in=900,
    )


def complete_upload(
    session: Session, user_id: UUID, upload_id: UUID
) -> UploadCompleteResponse:
    upload = session.get(Upload, upload_id)
    if upload is None or upload.user_id != user_id:
        raise HTTPException(status_code=404, detail="Upload bulunamadı.")
    upload.status = "completed"
    session.commit()
    return UploadCompleteResponse.model_validate(upload, from_attributes=True)


def delete_upload(session: Session, user_id: UUID, upload_id: UUID) -> None:
    upload = session.get(Upload, upload_id)
    if upload is None or upload.user_id != user_id:
        raise HTTPException(status_code=404, detail="Upload bulunamadı.")
    session.delete(upload)
    session.commit()
