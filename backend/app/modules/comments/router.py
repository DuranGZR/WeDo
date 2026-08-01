from uuid import UUID

from fastapi import APIRouter, status

from app.api.dependencies import SessionDep
from app.core.pagination import PageResponse, PaginationDep, paginate
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.comments.schemas import CommentCreate, CommentResponse, CommentUpdate
from app.modules.comments.service import (
    create_comment,
    delete_comment,
    list_comments,
    update_comment,
)
from app.modules.items.service import get_item
from app.modules.spaces.permissions import get_space_member

router = APIRouter()


def _access(session: SessionDep, item_id: UUID, user: CurrentUserDep):
    item = get_item(session, item_id)
    get_space_member(session, item.space_id, user.id)
    return item


@router.get("/items/{item_id}/comments", response_model=PageResponse[CommentResponse])
def list_comments_endpoint(
    item_id: UUID,
    session: SessionDep,
    current_user: CurrentUserDep,
    pagination: PaginationDep,
) -> PageResponse[CommentResponse]:
    _access(session, item_id, current_user)
    page, page_size = pagination
    return paginate(list_comments(session, item_id), page, page_size)


@router.post(
    "/items/{item_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_comment_endpoint(
    item_id: UUID,
    data: CommentCreate,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> CommentResponse:
    _access(session, item_id, current_user)
    return create_comment(session, item_id, current_user.id, data)


@router.patch("/comments/{comment_id}", response_model=CommentResponse)
def update_comment_endpoint(
    comment_id: UUID,
    data: CommentUpdate,
    session: SessionDep,
    current_user: CurrentUserDep,
) -> CommentResponse:
    return update_comment(session, comment_id, current_user.id, data)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment_endpoint(
    comment_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> None:
    delete_comment(session, comment_id, current_user.id)
