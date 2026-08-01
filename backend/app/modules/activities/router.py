from uuid import UUID

from fastapi import APIRouter

from app.api.dependencies import SessionDep
from app.core.pagination import PageResponse, PaginationDep, paginate
from app.modules.activities.schemas import ActivityResponse
from app.modules.activities.service import list_activities
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.spaces.permissions import get_space_member

router = APIRouter()


@router.get(
    "/spaces/{space_id}/activities", response_model=PageResponse[ActivityResponse]
)
def list_activities_endpoint(
    space_id: UUID,
    session: SessionDep,
    current_user: CurrentUserDep,
    pagination: PaginationDep,
) -> PageResponse[ActivityResponse]:
    get_space_member(session, space_id, current_user.id)
    page, page_size = pagination
    return paginate(list_activities(session, space_id), page, page_size)
