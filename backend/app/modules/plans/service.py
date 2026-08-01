from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.activities.service import record_activity
from app.modules.items.enums import ItemStatus
from app.modules.items.service import get_item
from app.modules.notifications.service import notify_space_members
from app.modules.plans.enums import PlanStatus
from app.modules.plans.models import Plan, PlanReminder
from app.modules.plans.repository import plan_repository
from app.modules.plans.schemas import PlanCreate, PlanResponse, PlanUpdate


def _response(plan: Plan) -> PlanResponse:
    return PlanResponse.model_validate(plan, from_attributes=True)


def create_plan(session: Session, user_id: UUID, data: PlanCreate) -> PlanResponse:
    item = get_item(session, data.item_id)
    if item.space_id != data.space_id:
        raise HTTPException(status_code=400, detail="Öğe aynı alana ait olmalı.")
    plan = Plan(
        space_id=data.space_id,
        item_id=data.item_id,
        created_by=user_id,
        scheduled_at=data.scheduled_at,
        timezone=data.timezone,
        note=data.note,
    )
    session.add(plan)
    item.status = ItemStatus.PLANNED
    session.flush()
    if data.reminder_minutes_before is not None:
        session.add(
            PlanReminder(
                plan_id=plan.id,
                reminder_at=data.scheduled_at
                - timedelta(minutes=data.reminder_minutes_before),
            )
        )
    record_activity(
        session,
        space_id=data.space_id,
        actor_id=user_id,
        activity_type="plan_proposed",
        entity_type="plan",
        entity_id=plan.id,
        payload={"item_id": str(item.id)},
    )
    session.commit()
    return _response(plan)


def list_plans(session: Session, space_id: UUID) -> list[PlanResponse]:
    return [
        _response(plan) for plan in plan_repository.list_for_space(session, space_id)
    ]


def process_due_reminders(session: Session, now: datetime | None = None) -> int:
    current_time = now or datetime.now(UTC)
    due_reminders = session.scalars(
        select(PlanReminder)
        .join(Plan, Plan.id == PlanReminder.plan_id)
        .where(
            PlanReminder.sent_at.is_(None),
            PlanReminder.reminder_at <= current_time,
            Plan.status.notin_([PlanStatus.CANCELLED, PlanStatus.COMPLETED]),
        )
        .with_for_update(skip_locked=True)
    ).all()
    processed = 0
    for reminder in due_reminders:
        plan = session.get(Plan, reminder.plan_id)
        if plan is None:
            reminder.sent_at = current_time
            continue
        notify_space_members(
            session,
            space_id=plan.space_id,
            actor_id=plan.created_by,
            notification_type="plan_reminder",
            title="Plan hatırlatması",
            body="Yaklaşan bir planınız var.",
            data={"plan_id": str(plan.id), "item_id": str(plan.item_id)},
        )
        reminder.sent_at = current_time
        processed += 1
    if processed or due_reminders:
        session.commit()
    return processed


def get_plan(session: Session, plan_id: UUID) -> Plan:
    plan = plan_repository.get_by_id(session, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan bulunamadı.")
    return plan


def update_plan(session: Session, plan_id: UUID, data: PlanUpdate) -> PlanResponse:
    plan = get_plan(session, plan_id)
    if plan.status in {PlanStatus.COMPLETED, PlanStatus.CANCELLED}:
        raise HTTPException(
            status_code=409, detail="Tamamlanan veya iptal edilen plan güncellenemez."
        )
    if data.scheduled_at is not None:
        plan.scheduled_at = data.scheduled_at
    if data.timezone is not None:
        plan.timezone = data.timezone
    if data.note is not None:
        plan.note = data.note
    session.commit()
    return _response(plan)


def change_status(
    session: Session, plan_id: UUID, user_id: UUID, target: PlanStatus
) -> PlanResponse:
    plan = get_plan(session, plan_id)
    now = datetime.now(UTC)
    plan.status = target
    if target == PlanStatus.APPROVED:
        plan.approved_at = now
    elif target == PlanStatus.CANCELLED:
        plan.cancelled_at = now
    elif target == PlanStatus.COMPLETED:
        plan.completed_at = now
        item = get_item(session, plan.item_id)
        item.status = ItemStatus.COMPLETED
        item.completed_at = now
    record_activity(
        session,
        space_id=plan.space_id,
        actor_id=user_id,
        activity_type=f"plan_{target}",
        entity_type="plan",
        entity_id=plan.id,
    )
    session.commit()
    return _response(plan)
