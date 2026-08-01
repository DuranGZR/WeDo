import time

from app.modules.notifications.worker import run_notification_cycle


def main() -> None:
    while True:
        run_notification_cycle()
        time.sleep(60)


if __name__ == "__main__":
    main()
