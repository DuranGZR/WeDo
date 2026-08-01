from app.db.session import SessionLocal
from app.modules.notifications.service import dispatch_pending_pushes
from app.modules.plans.service import process_due_reminders


def run_notification_cycle() -> tuple[int, int]:
    session = SessionLocal()
    try:
        reminders = process_due_reminders(session)
        pushes = dispatch_pending_pushes(session)
        return reminders, pushes
    finally:
        session.close()
