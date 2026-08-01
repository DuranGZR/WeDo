from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import SessionDep
from app.core.pagination import PageResponse, PaginationDep, paginate
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.invitations.repository import invitation_repository
from app.modules.invitations.schemas import (
    InvitationCreate,
    InvitationPreview,
    InvitationResponse,
)
from app.modules.invitations.service import (
    accept_invitation,
    create_invitation,
    list_invitations,
    preview_invitation,
    revoke_invitation,
)
from app.modules.spaces.dependencies import SpaceMemberDep
from app.modules.spaces.permissions import get_space_member, require_space_admin

router = APIRouter()


@router.post(
    "/spaces/{space_id}/invitations",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_invitation_endpoint(
    space_id: UUID,
    data: InvitationCreate,
    session: SessionDep,
    member: SpaceMemberDep,
    current_user: CurrentUserDep,
) -> InvitationResponse:
    require_space_admin(member)
    return create_invitation(session, space_id, current_user.id, data)


@router.get(
    "/spaces/{space_id}/invitations", response_model=PageResponse[InvitationResponse]
)
def list_invitations_endpoint(
    space_id: UUID,
    session: SessionDep,
    member: SpaceMemberDep,
    pagination: PaginationDep,
) -> PageResponse[InvitationResponse]:
    require_space_admin(member)
    page, page_size = pagination
    return paginate(list_invitations(session, space_id), page, page_size)


@router.delete("/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_invitation_endpoint(
    invitation_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> None:
    invitation = invitation_repository.get_by_id(session, invitation_id)
    if invitation is None:
        raise HTTPException(status_code=404, detail="Davet bulunamadı.")
    member = get_space_member(session, invitation.space_id, current_user.id)
    require_space_admin(member)
    revoke_invitation(session, invitation_id)


@router.get("/invitations/token/{token}", response_model=InvitationPreview)
def preview_invitation_endpoint(token: str, session: SessionDep) -> InvitationPreview:
    return preview_invitation(session, token)


@router.post("/invitations/token/{token}/accept", response_model=InvitationPreview)
def accept_invitation_endpoint(
    token: str, session: SessionDep, current_user: CurrentUserDep
) -> InvitationPreview:
    return accept_invitation(session, token, current_user.id)
