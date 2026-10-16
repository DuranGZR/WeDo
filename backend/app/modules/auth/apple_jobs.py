"""Run durable revocations even on an API-only deployment."""

import asyncio
import logging

from app.db.session import SessionLocal
from app.modules.auth.apple_lifecycle import process_revocations

logger = logging.getLogger(__name__)


def run_revocation_cycle() -> int:
    with SessionLocal() as session:
        return process_revocations(session)


async def revocation_loop() -> None:
    while True:
        try:
            await asyncio.to_thread(run_revocation_cycle)
        except Exception:
            logger.error("Apple revocation cycle failed; pending jobs retained")
        await asyncio.sleep(60)
