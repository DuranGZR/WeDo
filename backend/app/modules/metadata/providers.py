from typing import Protocol
from urllib.parse import quote, urlparse

from app.modules.metadata.exceptions import MetadataError


class ProviderFetcher(Protocol):
    def fetch_json(self, url: str) -> dict[str, object]: ...


def _string(payload: dict[str, object], key: str) -> str | None:
    value = payload.get(key)
    return value.strip() if isinstance(value, str) and value.strip() else None


def _provider_endpoint(url: str) -> str | None:
    host = (urlparse(url).hostname or "").lower()
    encoded_url = quote(url, safe="")

    if host == "youtu.be" or host.endswith("youtube.com"):
        return f"https://www.youtube.com/oembed?url={encoded_url}&format=json"
    if host.endswith("tiktok.com"):
        return f"https://www.tiktok.com/oembed?url={encoded_url}"
    return None


def resolve_provider_metadata(
    url: str, fetcher: ProviderFetcher
) -> dict[str, str | None]:
    """Fetch a provider preview when a page hides its Open Graph metadata."""
    endpoint = _provider_endpoint(url)
    if endpoint is None:
        return {"title": None, "description": None, "image_url": None}

    try:
        payload = fetcher.fetch_json(endpoint)
    except MetadataError:
        return {"title": None, "description": None, "image_url": None}

    return {
        "title": _string(payload, "title"),
        "description": _string(payload, "author_name"),
        "image_url": _string(payload, "thumbnail_url"),
    }
