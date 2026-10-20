"""Operator-only CLI. Uses server environment credentials; exposes no admin HTTP API."""

import argparse
import json
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import delete, select

from app.db import models as _models  # noqa: F401
from app.db.session import SessionLocal
from app.modules.auth.repository import auth_repository
from app.modules.items.models import Item, ItemPreviewImage
from app.modules.notifications.models import DevicePushToken
from app.modules.safety.models import ContentReport
from app.modules.safety.service import notify_report, remove_reported_item
from app.modules.users.models import User


def review_report(session, report_id: UUID, action: str, note: str) -> None:
    report = session.scalar(
        select(ContentReport).where(ContentReport.id == report_id).with_for_update()
    )
    if not report or report.status != "pending":
        raise ValueError("Pending report not found")
    if not note.strip():
        raise ValueError("A review note is required")
    if action == "remove":
        remove_reported_item(session, report)
    elif action == "suspend":
        user = (
            session.get(User, report.subject_user_id)
            if report.subject_user_id
            else None
        )
        if not user:
            raise ValueError("This report has no user to suspend")
        user.is_active = False
        auth_repository.revoke_all_for_user(session, user.id)
        session.execute(
            delete(DevicePushToken).where(DevicePushToken.user_id == user.id)
        )
        item_ids = select(Item.id).where(Item.created_by == user.id)
        session.execute(
            delete(ItemPreviewImage).where(ItemPreviewImage.item_id.in_(item_ids))
        )
        for item in session.scalars(select(Item).where(Item.created_by == user.id)):
            item.deleted_at = datetime.now(UTC)
    elif action != "dismiss":
        raise ValueError("Unknown review action")
    report.status = "dismissed" if action == "dismiss" else "resolved"
    report.resolution = f"{action}: {note.strip()}"
    report.reviewed_at = datetime.now(UTC)
    session.commit()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("pending", help="List reports in oldest-first order")
    sub.add_parser("notify", help="Retry unsent report emails")
    show = sub.add_parser("show")
    show.add_argument("report_id", type=UUID)
    review = sub.add_parser("review")
    review.add_argument("report_id", type=UUID)
    review.add_argument("action", choices=("remove", "suspend", "dismiss"))
    review.add_argument("--note", required=True)
    args = parser.parse_args()
    with SessionLocal() as session:
        if args.command == "review":
            try:
                review_report(session, args.report_id, args.action, args.note)
            except ValueError as error:
                parser.error(str(error))
            print("Report reviewed.")
        elif args.command == "show":
            report = session.get(ContentReport, args.report_id)
            if not report:
                parser.error("Report not found")
            print(
                json.dumps(
                    {
                        "id": str(report.id),
                        "status": report.status,
                        "reason": report.reason,
                        "details": report.details,
                        "target_type": report.target_type,
                        "target_id": str(report.target_id),
                        "subject_user_id": str(report.subject_user_id),
                        "snapshot": report.snapshot,
                        "created_at": str(report.created_at),
                        "resolution": report.resolution,
                    },
                    ensure_ascii=True,
                    indent=2,
                )
            )
        else:
            reports = session.scalars(
                select(ContentReport)
                .where(ContentReport.status == "pending")
                .order_by(ContentReport.created_at)
            ).all()
            for report in reports:
                if args.command == "notify":
                    if report.notified_at is None:
                        print(
                            report.id,
                            "sent" if notify_report(session, report.id) else "pending",
                        )
                else:
                    print(
                        report.id, report.created_at, report.target_type, report.reason
                    )


if __name__ == "__main__":
    main()
