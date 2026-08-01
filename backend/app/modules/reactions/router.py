from uuid import UUID

from fastapi import APIRouter, status

from app.api.dependencies import SessionDep
from app.core.pagination import PageResponse, PaginationDep, paginate
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.items.service import get_item
from app.modules.reactions.schemas import ReactionRequest, ReactionResponse
from app.modules.reactions.service import list_reactions, remove_reaction, set_reaction
from app.modules.spaces.permissions import get_space_member

router = APIRouter()


def _access(session: SessionDep, item_id: UUID, user: CurrentUserDep):
    item = get_item(session, item_id)
    get_space_member(session, item.space_id, user.id)
    return item


@router.put("/items/{item_id}/reaction", response_model=ReactionResponse)
def set_reaction_endpoint(
    item_id: UUID,
    data: ReactionRequest,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> ReactionResponse:
    _access(session, item_id, current_user)
    return set_reaction(session, item_id, current_user.id, data)


@router.delete("/items/{item_id}/reaction", status_code=status.HTTP_204_NO_CONTENT)
def remove_reaction_endpoint(
    item_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> None:
    _access(session, item_id, current_user)
    remove_reaction(session, item_id, current_user.id)


@router.get("/items/{item_id}/reactions", response_model=PageResponse[ReactionResponse])
def list_reactions_endpoint(
    item_id: UUID,
    session: SessionDep,
    current_user: CurrentUserDep,
    pagination: PaginationDep,
) -> PageResponse[ReactionResponse]:
    _access(session, item_id, current_user)
    page, page_size = pagination
    return paginate(list_reactions(session, item_id), page, page_size)
