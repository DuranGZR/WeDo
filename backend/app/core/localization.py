import json
import re
from contextlib import contextmanager
from contextvars import ContextVar
from pathlib import Path

from starlette.middleware.base import BaseHTTPMiddleware

_language = ContextVar("language", default="tr")
_root = Path(__file__).resolve().parent.parent / "locales"
CATALOGS = {
    lang: json.loads((_root / f"{lang}.json").read_text(encoding="utf-8"))
    for lang in ("tr", "en")
}


def resolve_language(value: str | None) -> str:
    candidates = []
    for index, part in enumerate((value or "").split(",")):
        sections = part.strip().split(";")
        language = sections[0].lower().replace("_", "-").split("-")[0]
        quality = 1.0
        try:
            for section in sections[1:]:
                if section.strip().startswith("q="):
                    quality = float(section.strip()[2:])
        except ValueError:
            continue
        if language in ("tr", "en") and 0 < quality <= 1:
            candidates.append((quality, -index, language))
    return max(candidates)[2] if candidates else "en"


def current_language() -> str:
    return _language.get()


@contextmanager
def language_context(language: str):
    token = _language.set(resolve_language(language))
    try:
        yield
    finally:
        _language.reset(token)


class LocalizedMessage(str):
    key: str
    params: dict


def message(key: str, *, language: str | None = None, **params) -> LocalizedMessage:
    lang = resolve_language(language) if language else current_language()
    template = CATALOGS[lang].get(key, CATALOGS["en"].get(key, "Something went wrong."))
    value = re.sub(
        r"\{\{([A-Za-z0-9_]+)\}\}",
        lambda match: str(params.get(match[1], "")),
        template,
    )
    result = LocalizedMessage(value)
    result.key, result.params = key, params
    return result


class LanguageMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        explicit = request.query_params.get("lang")
        language = resolve_language(
            explicit
            if explicit in ("tr", "en")
            else request.headers.get("Accept-Language")
        )
        with language_context(language):
            response = await call_next(request)
            response.headers["Content-Language"] = language
            vary = response.headers.get("Vary", "")
            response.headers["Vary"] = ", ".join(
                filter(None, [vary, "Accept-Language"])
            )
            return response
