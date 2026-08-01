from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.invitations.models import Invitation
from app.modules.invitations.repository import invitation_repository
from app.modules.invitations.schemas import (
    InvitationCreate,
    InvitationPreview,
    InvitationResponse,
)
from app.modules.invitations.tokens import (
    generate_invitation_token,
    hash_invitation_token,
)
from app.modules.notifications.service import (
    create_notification,
    dispatch_pending_pushes,
)
from app.modules.spaces.models import SpaceMember
from app.modules.spaces.repository import space_member_repository, space_repository
from app.modules.users.models import User


def _validate(invitation: Invitation) -> None:
    expires_at = invitation.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if invitation.revoked_at is not None or expires_at <= datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Davet geçersiz veya süresi dolmuş.",
        )
    if invitation.use_count >= invitation.max_uses:
        raise HTTPException(
            status_code=status.HTTP_410_GONE, detail="Davet kullanım limitine ulaştı."
        )


def _response(invitation: Invitation, token: str | None = None) -> InvitationResponse:
    invite_url = None
    if token:
        invite_url = (
            f"{settings.mobile_scheme}://invite/{token}"
            if settings.environment == "production"
            else f"{settings.frontend_url}/invite/{token}"
        )
    return InvitationResponse(
        id=invitation.id,
        space_id=invitation.space_id,
        expires_at=invitation.expires_at,
        max_uses=invitation.max_uses,
        use_count=invitation.use_count,
        revoked_at=invitation.revoked_at,
        invite_url=invite_url,
    )


def create_invitation(
    session: Session, space_id: UUID, user_id: UUID, data: InvitationCreate
) -> InvitationResponse:
    token = generate_invitation_token()
    invitation = invitation_repository.create(
        session,
        Invitation(
            space_id=space_id,
            created_by=user_id,
            token_hash=hash_invitation_token(token),
            expires_at=datetime.now(UTC) + timedelta(days=data.expires_in_days),
            max_uses=data.max_uses,
        ),
    )
    session.commit()
    return _response(invitation, token)


def list_invitations(session: Session, space_id: UUID) -> list[InvitationResponse]:
    return [
        _response(item)
        for item in invitation_repository.list_for_space(session, space_id)
    ]


def revoke_invitation(session: Session, invitation_id: UUID) -> None:
    invitation = invitation_repository.get_by_id(session, invitation_id)
    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Davet bulunamadı."
        )
    invitation.revoked_at = datetime.now(UTC)
    session.commit()


def preview_invitation(session: Session, token: str) -> InvitationPreview:
    invitation = invitation_repository.get_by_token_hash(
        session, hash_invitation_token(token)
    )
    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Davet bulunamadı."
        )
    _validate(invitation)
    space = space_repository.get_by_id(session, invitation.space_id)
    inviter = session.get(User, invitation.created_by)
    return InvitationPreview(
        id=invitation.id,
        space_id=invitation.space_id,
        expires_at=invitation.expires_at,
        remaining_uses=invitation.max_uses - invitation.use_count,
        space_name=space.name if space else "Ortak alan",
        inviter_name=inviter.display_name if inviter else "Bir WeDo kullanıcısı",
    )


def accept_invitation(session: Session, token: str, user_id: UUID) -> InvitationPreview:
    invitation = invitation_repository.get_by_token_hash(
        session, hash_invitation_token(token), lock=True
    )
    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Davet bulunamadı."
        )
    _validate(invitation)
    existing = space_member_repository.get_by_space_and_user(
        session, invitation.space_id, user_id
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu alanın zaten üyesisin.",
        )
    space_member_repository.create(
        session, SpaceMember(space_id=invitation.space_id, user_id=user_id)
    )
    create_notification(
        session,
        user_id=invitation.created_by,
        notification_type="invitation_accepted",
        title="Davet kabul edildi",
        body="Partnerin ortak alana katıldı.",
        space_id=invitation.space_id,
        actor_id=user_id,
        data={"space_id": str(invitation.space_id)},
    )
    invitation.use_count += 1
    session.commit()
    dispatch_pending_pushes(session)
    space = space_repository.get_by_id(session, invitation.space_id)
    inviter = session.get(User, invitation.created_by)
    return InvitationPreview(
        id=invitation.id,
        space_id=invitation.space_id,
        expires_at=invitation.expires_at,
        remaining_uses=invitation.max_uses - invitation.use_count,
        space_name=space.name if space else "Ortak alan",
        inviter_name=inviter.display_name if inviter else "Bir WeDo kullanıcısı",
    )
