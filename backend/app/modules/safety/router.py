from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, status

from app.api.dependencies import SessionDep
from app.core.pagination import PageResponse, PaginationDep, paginate
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.safety.schemas import BlockResponse, ReportCreate, ReportResponse
from app.modules.safety.service import (
    block_user,
    create_report,
    list_blocks,
    notify_report,
    unblock_user,
)

router = APIRouter()


@router.post("/reports", response_model=ReportResponse, status_code=201)
def report_endpoint(
    data: ReportCreate,
    session: SessionDep,
    current_user: CurrentUserDep,
    background_tasks: BackgroundTasks,
) -> ReportResponse:
    report = create_report(session, current_user.id, data)
    # Saving the complaint does not depend on having a mail app or email availability.
    background_tasks.add_task(notify_report, session, report.id)
    return ReportResponse.model_validate(report)


@router.get("/blocks", response_model=PageResponse[BlockResponse])
def blocks_endpoint(
    session: SessionDep, current_user: CurrentUserDep, pagination: PaginationDep
) -> PageResponse[BlockResponse]:
    return paginate(list_blocks(session, current_user.id), *pagination)


@router.put("/blocks/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def block_endpoint(
    user_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> None:
    block_user(session, current_user.id, user_id)


@router.delete("/blocks/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def unblock_endpoint(
    user_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> None:
    unblock_user(session, current_user.id, user_id)
