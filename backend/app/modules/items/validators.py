from hashlib import sha256
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

REMOVED_QUERY_KEYS = {
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "fbclid",
    "gclid",
}


def normalize_url(url: str) -> str:
    parts = urlsplit(url.strip())
    query = urlencode(
        [
            (key, value)
            for key, value in parse_qsl(parts.query, keep_blank_values=True)
            if key.lower() not in REMOVED_QUERY_KEYS
        ]
    )
    return urlunsplit(
        (parts.scheme.lower(), parts.netloc.lower(), parts.path or "/", query, "")
    )


def url_hash(url: str) -> str:
    return sha256(normalize_url(url).encode("utf-8")).hexdigest()
