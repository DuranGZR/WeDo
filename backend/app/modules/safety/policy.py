"""A small configurable text/domain filter, supplemented by human moderation.

This is deliberately not an image classifier or a complete abuse detector.
"""

import re
import unicodedata
from urllib.parse import urlsplit

from fastapi import HTTPException

from app.core.config import settings
from app.core.localization import message


def normalized(value: str) -> str:
    text = unicodedata.normalize("NFKC", value).casefold().replace("\u0307", "")
    return " ".join("".join(c for c in text if unicodedata.category(c) != "Cf").split())


def violates_policy(*texts: str | None, urls: tuple[str | None, ...] = ()) -> bool:
    for text in texts:
        if text and any(
            re.search(
                r"(?<!\w)" + re.escape(normalized(term)) + r"(?!\w)", normalized(text)
            )
            for term in settings.content_blocked_terms
            if normalized(term)
        ):
            return True
    for url in urls:
        if not url:
            continue
        try:
            host = (urlsplit(str(url)).hostname or "").lower().rstrip(".")
        except ValueError:
            # Malformed third-party metadata must not leave a worker processing
            # forever or bypass domain checks.
            return True
        if any(
            host == domain.lower() or host.endswith("." + domain.lower())
            for domain in settings.content_blocked_domains
            if domain
        ):
            return True
    return False


def check_content(*texts: str | None, urls: tuple[str | None, ...] = ()) -> None:
    if violates_policy(*texts, urls=urls):
        raise HTTPException(status_code=422, detail=message("safety.contentRejected"))
