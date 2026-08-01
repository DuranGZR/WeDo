from uuid import UUID

from fastapi import APIRouter

from app.api.dependencies import SessionDep
from app.core.pagination import PageResponse, PaginationDep, paginate
from app.modules.auth.dependencies import CurrentUserDep
from app.modules.plans.enums import PlanStatus
from app.modules.plans.schemas import PlanCreate, PlanResponse, PlanUpdate
from app.modules.plans.service import (
    change_status,
    create_plan,
    get_plan,
    list_plans,
    update_plan,
)
from app.modules.spaces.permissions import get_space_member

router = APIRouter()


@router.get("/spaces/{space_id}/plans", response_model=PageResponse[PlanResponse])
def list_plans_endpoint(
    space_id: UUID,
    session: SessionDep,
    current_user: CurrentUserDep,
    pagination: PaginationDep,
) -> PageResponse[PlanResponse]:
    get_space_member(session, space_id, current_user.id)
    page, page_size = pagination
    return paginate(list_plans(session, space_id), page, page_size)


@router.post("/plans", response_model=PlanResponse, status_code=201)
def create_plan_endpoint(
    data: PlanCreate, session: SessionDep, current_user: CurrentUserDep
) -> PlanResponse:
    get_space_member(session, data.space_id, current_user.id)
    return create_plan(session, current_user.id, data)


@router.get("/plans/{plan_id}", response_model=PlanResponse)
def get_plan_endpoint(
    plan_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> PlanResponse:
    plan = get_plan(session, plan_id)
    get_space_member(session, plan.space_id, current_user.id)
    return PlanResponse.model_validate(plan, from_attributes=True)


@router.patch("/plans/{plan_id}", response_model=PlanResponse)
def update_plan_endpoint(
    plan_id: UUID, data: PlanUpdate, session: SessionDep, current_user: CurrentUserDep
) -> PlanResponse:
    plan = get_plan(session, plan_id)
    get_space_member(session, plan.space_id, current_user.id)
    return update_plan(session, plan_id, data)


def _change(
    plan_id: UUID, target: PlanStatus, session: SessionDep, current_user: CurrentUserDep
) -> PlanResponse:
    plan = get_plan(session, plan_id)
    get_space_member(session, plan.space_id, current_user.id)
    return change_status(session, plan_id, current_user.id, target)


@router.post("/plans/{plan_id}/approve", response_model=PlanResponse)
def approve_plan(
    plan_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> PlanResponse:
    return _change(plan_id, PlanStatus.APPROVED, session, current_user)


@router.post("/plans/{plan_id}/reject", response_model=PlanResponse)
def reject_plan(
    plan_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> PlanResponse:
    return _change(plan_id, PlanStatus.REJECTED, session, current_user)


@router.post("/plans/{plan_id}/cancel", response_model=PlanResponse)
def cancel_plan(
    plan_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> PlanResponse:
    return _change(plan_id, PlanStatus.CANCELLED, session, current_user)


@router.post("/plans/{plan_id}/complete", response_model=PlanResponse)
def complete_plan(
    plan_id: UUID, session: SessionDep, current_user: CurrentUserDep
) -> PlanResponse:
    return _change(plan_id, PlanStatus.COMPLETED, session, current_user)
