from collections.abc import Iterable

import httpx

from app.core.config import settings


def send_expo_push(messages: Iterable[dict]) -> bool:
    payload = list(messages)
    if not payload:
        return True
    try:
        response = httpx.post(settings.expo_push_url, json=payload, timeout=5.0)
        response.raise_for_status()
        return True
    except httpx.HTTPError:
        # Push delivery is best-effort; notification records remain durable.
        return False
