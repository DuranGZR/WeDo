"""Export the public static legal pages from the same source as the API pages."""

import argparse
import sys
from pathlib import Path

from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.localization import language_context  # noqa: E402
from app.modules.legal.render import render_legal_page  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
LIVE_URL = "https://wedo-production-3ad2.up.railway.app/legal"


def export_page(language: str) -> str:
    with language_context(language):
        soup = BeautifulSoup(render_legal_page(), "html.parser")
    for script in soup.find_all("script"):
        script.decompose()
    link = soup.new_tag("a", href=f"{LIVE_URL}?lang={language}#delete-account")
    link.string = (
        "Güvenli hesap silme talep formunu açın"
        if language == "tr"
        else "Open the secure account deletion request form"
    )
    paragraph = soup.new_tag("p")
    paragraph.append(link)
    soup.find("form").replace_with(paragraph)
    for anchor in soup.select('a[lang="tr"]'):
        anchor["href"] = "../" if language == "en" else "./"
    for anchor in soup.select('a[lang="en"]'):
        anchor["href"] = "./" if language == "en" else "en/"
    return str(soup).rstrip() + "\n"


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    for language, relative in (
        ("tr", "docs/legal/index.html"),
        ("en", "docs/legal/en/index.html"),
    ):
        path = ROOT / relative
        content = export_page(language)
        if args.check:
            if not path.exists() or path.read_text(encoding="utf-8") != content:
                raise SystemExit(f"Outdated legal page: {relative}")
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
    print("Static TR/EN legal pages match the shared source.")
