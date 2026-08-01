from uuid import UUID

from fastapi import APIRouter, status

from app.api.dependencies import SessionDep
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.uploads.schemas import (
    PresignRequest,
    PresignResponse,
    UploadCompleteRequest,
    UploadCompleteResponse,
)
from app.modules.uploads.service import (
    complete_upload,
    create_presigned_upload,
    delete_upload,
)

router = APIRouter()


@router.post(
    "/uploads/presign",
    response_model=PresignResponse,
    status_code=status.HTTP_201_CREATED,
)
def presign_upload_endpoint(
    data: PresignRequest, session: SessionDep, current_user: CurrentUserDep
) -> PresignResponse:
    return create_presigned_upload(session, current_user.id, data)


@router.post("/uploads/{upload_id}/complete", response_model=UploadCompleteResponse)
def complete_upload_endpoint(
    upload_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> UploadCompleteResponse:
    return complete_upload(session, current_user.id, upload_id)


@router.post("/uploads/complete", response_model=UploadCompleteResponse)
def complete_upload_contract_endpoint(
    data: UploadCompleteRequest,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> UploadCompleteResponse:
    return complete_upload(session, current_user.id, data.upload_id)


@router.delete("/uploads/{upload_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_upload_endpoint(
    upload_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> None:
    delete_upload(session, current_user.id, upload_id)
