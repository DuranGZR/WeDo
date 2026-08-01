import json
from collections.abc import Iterator
from urllib.parse import urljoin

from bs4 import BeautifulSoup


def _meta(soup: BeautifulSoup, *names: str) -> str | None:
    for name in names:
        tag = soup.find("meta", attrs={"property": name}) or soup.find(
            "meta", attrs={"name": name}
        )
        if tag and tag.get("content"):
            return str(tag["content"]).strip()
    return None


def _image_value(value: object) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    if isinstance(value, list):
        for entry in value:
            image_url = _image_value(entry)
            if image_url:
                return image_url
    if isinstance(value, dict):
        for key in ("url", "contentUrl", "thumbnailUrl"):
            image_url = _image_value(value.get(key))
            if image_url:
                return image_url
    return None


def _json_ld_nodes(value: object) -> Iterator[dict[str, object]]:
    if isinstance(value, dict):
        yield value
        for nested_value in value.values():
            yield from _json_ld_nodes(nested_value)
    elif isinstance(value, list):
        for entry in value:
            yield from _json_ld_nodes(entry)


def _json_ld_image(soup: BeautifulSoup) -> str | None:
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        if not script.string:
            continue
        try:
            payload = json.loads(script.string)
        except json.JSONDecodeError:
            continue
        for node in _json_ld_nodes(payload):
            for key in ("image", "thumbnailUrl", "thumbnail_url"):
                image_url = _image_value(node.get(key))
                if image_url:
                    return image_url
    return None


def _absolute_url(value: str | None, base_url: str | None) -> str | None:
    if not value:
        return None
    return urljoin(base_url, value) if base_url else value


def parse_metadata(html: str, base_url: str | None = None) -> dict[str, str | None]:
    soup = BeautifulSoup(html, "html.parser")
    title = _meta(soup, "og:title", "twitter:title")
    description = _meta(soup, "og:description", "twitter:description", "description")
    image_url = (
        _meta(soup, "og:image", "og:image:url", "twitter:image", "twitter:image:src")
        or _meta(soup, "image")
        or _json_ld_image(soup)
    )
    canonical = soup.find("link", rel="canonical")
    if not title and soup.title and soup.title.string:
        title = soup.title.string.strip()
    return {
        "title": title,
        "description": description,
        "image_url": _absolute_url(image_url, base_url),
        "canonical_url": _absolute_url(str(canonical["href"]).strip(), base_url)
        if canonical and canonical.get("href")
        else None,
    }
