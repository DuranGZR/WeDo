import html
import json
import re
from pathlib import Path

from app.core.localization import current_language, message

_template = (Path(__file__).resolve().parents[2] / "templates/legal.html").read_text(
    encoding="utf-8"
)


def render_legal_page() -> str:
    rendered = re.sub(
        r"\{\{(web\.[A-Za-z0-9_]+)\}\}",
        lambda match: html.escape(message(match[1])),
        _template,
    )
    rendered = rendered.replace("__LANG__", current_language())
    for marker, key in (
        ("__FORM_PENDING__", "web.formPending"),
        ("__FORM_FAILED__", "web.formFailed"),
    ):
        rendered = rendered.replace(
            marker, json.dumps(str(message(key)), ensure_ascii=True)
        )
    return rendered
