import logging
import time

from app.modules.auth.apple_jobs import run_revocation_cycle
from app.modules.notifications.worker import run_notification_cycle

logger = logging.getLogger(__name__)


def main() -> None:
    while True:
        try:
            run_revocation_cycle()
        except Exception:
            logger.error("Apple revocation cycle failed; pending jobs retained")
        try:
            run_notification_cycle()
        except Exception:
            logger.error("Notification cycle failed")
        time.sleep(60)


if __name__ == "__main__":
    main()
