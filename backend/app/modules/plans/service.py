from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.localization import message
from app.modules.activities.service import record_activity
from app.modules.items.enums import ItemStatus
from app.modules.items.service import get_item
from app.modules.notifications.service import (
    dispatch_pending_pushes,
    notify_space_members,
)
from app.modules.plans.enums import PlanStatus
from app.modules.plans.models import Plan, PlanReminder
from app.modules.plans.repository import plan_repository
from app.modules.plans.schemas import PlanCreate, PlanResponse, PlanUpdate
from app.modules.safety.policy import check_content


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def _compute_reminder_minutes(plan: Plan, reminder: PlanReminder | None) -> int | None:
    if reminder is None:
        return None
    delta_seconds = (
        _as_utc(plan.scheduled_at) - _as_utc(reminder.reminder_at)
    ).total_seconds()
    minutes = round(delta_seconds / 60)
    return minutes if minutes > 0 else None


def _responses(session: Session, plans: list[Plan]) -> list[PlanResponse]:
    if not plans:
        return []
    plan_ids = [plan.id for plan in plans]
    reminders = session.scalars(
        select(PlanReminder).where(PlanReminder.plan_id.in_(plan_ids))
    ).all()
    reminder_by_plan = {reminder.plan_id: reminder for reminder in reminders}
    return [
        PlanResponse.model_validate(plan, from_attributes=True).model_copy(
            update={
                "reminder_minutes_before": _compute_reminder_minutes(
                    plan, reminder_by_plan.get(plan.id)
                )
            }
        )
        for plan in plans
    ]


def _response(session: Session, plan: Plan) -> PlanResponse:
    return _responses(session, [plan])[0]


def get_plan_response(session: Session, plan_id: UUID) -> PlanResponse:
    return _response(session, get_plan(session, plan_id))


def create_plan(session: Session, user_id: UUID, data: PlanCreate) -> PlanResponse:
    check_content(data.note)
    item = get_item(session, data.item_id)
    if item.space_id != data.space_id:
        raise HTTPException(
            status_code=400, detail=message("message.theItemMustBelongToTheSameSpace")
        )
    now = datetime.now(UTC)
    plan = Plan(
        space_id=data.space_id,
        item_id=data.item_id,
        created_by=user_id,
        scheduled_at=data.scheduled_at,
        timezone=data.timezone,
        note=data.note,
        status=PlanStatus.APPROVED,
        approved_at=now,
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
        activity_type="plan_scheduled",
        entity_type="plan",
        entity_id=plan.id,
        payload={"item_id": str(item.id)},
    )
    notify_space_members(
        session,
        space_id=data.space_id,
        actor_id=user_id,
        notification_type="plan_scheduled",
        title=message("message.newPlanScheduled"),
        body=message("message.someoneScheduledAPlan"),
        data={
            "plan_id": str(plan.id),
            "item_id": str(item.id),
            "space_id": str(data.space_id),
        },
    )
    session.commit()
    dispatch_pending_pushes(session)
    return _response(session, plan)


def list_plans(session: Session, space_id: UUID) -> list[PlanResponse]:
    return _responses(session, plan_repository.list_for_space(session, space_id))


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
            title=message("message.planReminder"),
            body=message("message.youHaveAnUpcomingPlan"),
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
        raise HTTPException(status_code=404, detail=message("message.planNotFound"))
    return plan


def update_plan(
    session: Session,
    plan_id: UUID,
    data: PlanUpdate,
    actor_id: UUID | None = None,
) -> PlanResponse:
    check_content(data.note)
    plan = get_plan(session, plan_id)
    if plan.status in {PlanStatus.COMPLETED, PlanStatus.CANCELLED, PlanStatus.REJECTED}:
        raise HTTPException(
            status_code=409,
            detail=message("message.completedOrCancelledPlansCanTBeUpdated"),
        )
    existing_reminder = session.scalar(
        select(PlanReminder).where(PlanReminder.plan_id == plan.id)
    )
    current_minutes = _compute_reminder_minutes(plan, existing_reminder)
    if data.scheduled_at is not None:
        plan.scheduled_at = data.scheduled_at
    if data.timezone is not None:
        plan.timezone = data.timezone
    if "note" in data.model_fields_set:
        plan.note = data.note
    target_minutes = (
        data.reminder_minutes_before
        if "reminder_minutes_before" in data.model_fields_set
        else current_minutes
    )
    if target_minutes is not None:
        reminder_at = _as_utc(plan.scheduled_at) - timedelta(minutes=target_minutes)
        if existing_reminder is not None:
            existing_reminder.reminder_at = reminder_at
            if reminder_at > datetime.now(UTC):
                existing_reminder.sent_at = None
        else:
            session.add(PlanReminder(plan_id=plan.id, reminder_at=reminder_at))
    elif (
        "reminder_minutes_before" in data.model_fields_set
        and existing_reminder is not None
    ):
        session.delete(existing_reminder)
    if actor_id is not None:
        record_activity(
            session,
            space_id=plan.space_id,
            actor_id=actor_id,
            activity_type="plan_updated",
            entity_type="plan",
            entity_id=plan.id,
            payload={"item_id": str(plan.item_id)},
        )
    session.commit()
    return _response(session, plan)


def change_status(
    session: Session, plan_id: UUID, user_id: UUID, target: PlanStatus
) -> PlanResponse:
    plan = get_plan(session, plan_id)
    if plan.status in {PlanStatus.COMPLETED, PlanStatus.CANCELLED, PlanStatus.REJECTED}:
        raise HTTPException(
            status_code=409,
            detail=message("message.completedOrCancelledPlansCanTBeUpdated"),
        )
    now = datetime.now(UTC)
    plan.status = target
    item = get_item(session, plan.item_id)
    if target == PlanStatus.APPROVED:
        plan.approved_at = now
        notify_space_members(
            session,
            space_id=plan.space_id,
            actor_id=user_id,
            notification_type="plan_approved",
            title=message("message.planApprovedTitle"),
            body=message("message.partnerApprovedYourPlan"),
            data={
                "plan_id": str(plan.id),
                "item_id": str(plan.item_id),
                "space_id": str(plan.space_id),
            },
        )
    elif target == PlanStatus.REJECTED:
        plan.cancelled_at = now
        other_active = session.scalar(
            select(Plan.id).where(
                Plan.item_id == plan.item_id,
                Plan.id != plan.id,
                Plan.status.in_([PlanStatus.PROPOSED, PlanStatus.APPROVED]),
            )
        )
        if other_active is None and item.status == ItemStatus.PLANNED:
            item.status = ItemStatus.NEW
        notify_space_members(
            session,
            space_id=plan.space_id,
            actor_id=user_id,
            notification_type="plan_rejected",
            title=message("message.planRejectedTitle"),
            body=message("message.partnerRejectedYourPlan"),
            data={
                "plan_id": str(plan.id),
                "item_id": str(plan.item_id),
                "space_id": str(plan.space_id),
            },
        )
    elif target == PlanStatus.CANCELLED:
        plan.cancelled_at = now
        other_active = session.scalar(
            select(Plan.id).where(
                Plan.item_id == plan.item_id,
                Plan.id != plan.id,
                Plan.status.in_([PlanStatus.PROPOSED, PlanStatus.APPROVED]),
            )
        )
        if other_active is None and item.status == ItemStatus.PLANNED:
            item.status = ItemStatus.NEW
    elif target == PlanStatus.COMPLETED:
        plan.completed_at = now
        item.status = ItemStatus.COMPLETED
        item.completed_at = now
    record_activity(
        session,
        space_id=plan.space_id,
        actor_id=user_id,
        activity_type=f"plan_{target}",
        entity_type="plan",
        entity_id=plan.id,
        payload={"item_id": str(plan.item_id)},
    )
    session.commit()
    dispatch_pending_pushes(session)
    return _response(session, plan)
