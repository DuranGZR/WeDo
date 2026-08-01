from collections.abc import Sequence
from typing import Annotated

from fastapi import Depends, Query
from pydantic import BaseModel


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    has_more: bool


class PageResponse[T](BaseModel):
    data: list[T]
    pagination: PaginationMeta


def page_query(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> tuple[int, int]:
    return page, page_size


PaginationDep = Annotated[tuple[int, int], Depends(page_query)]


def paginate[T](items: Sequence[T], page: int, page_size: int) -> PageResponse[T]:
    start = (page - 1) * page_size
    selected = list(items[start : start + page_size + 1])
    has_more = len(selected) > page_size
    return PageResponse(
        data=selected[:page_size],
        pagination=PaginationMeta(page=page, page_size=page_size, has_more=has_more),
    )
