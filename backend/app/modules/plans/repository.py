from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.plans.models import Plan


class PlanRepository:
    def get_by_id(self, session: Session, plan_id: UUID) -> Plan | None:
        return session.get(Plan, plan_id)

    def list_for_space(self, session: Session, space_id: UUID) -> list[Plan]:
        return list(
            session.scalars(
                select(Plan)
                .where(Plan.space_id == space_id)
                .order_by(Plan.scheduled_at)
            ).all()
        )


plan_repository = PlanRepository()
