import pytest
from app.modules.metadata.exceptions import MetadataError
from app.modules.metadata.parser import parse_metadata
from app.modules.metadata.providers import resolve_provider_metadata
from app.modules.metadata.security import validate_url


def test_metadata_parser_prefers_open_graph() -> None:
    metadata = parse_metadata(
        """
        <html><head>
          <title>Fallback title</title>
          <meta property="og:title" content="Open Graph title">
          <meta property="og:description" content="A description">
          <meta property="og:image" content="https://cdn.example.com/image.jpg">
          <link rel="canonical" href="https://example.com/canonical">
        </head></html>
        """
    )

    assert metadata == {
        "title": "Open Graph title",
        "description": "A description",
        "image_url": "https://cdn.example.com/image.jpg",
        "canonical_url": "https://example.com/canonical",
    }


@pytest.mark.parametrize(
    "url", ["file:///etc/passwd", "ftp://example.com/file", "http://127.0.0.1"]
)
def test_metadata_blocks_unsafe_urls(url: str) -> None:
    with pytest.raises(MetadataError):
        validate_url(url)


def test_metadata_parser_uses_json_ld_image_and_resolves_relative_urls() -> None:
    metadata = parse_metadata(
        """
        <html><head>
          <script type="application/ld+json">
            {"@type": "Product", "image": ["/images/product.jpg"]}
          </script>
          <link rel="canonical" href="/products/123">
        </head></html>
        """,
        base_url="https://shop.example.com/category/item",
    )

    assert metadata["image_url"] == "https://shop.example.com/images/product.jpg"
    assert metadata["canonical_url"] == "https://shop.example.com/products/123"


@pytest.mark.parametrize(
    ("url", "expected_provider"),
    [
        ("https://www.youtube.com/watch?v=abc", "youtube.com/oembed"),
        ("https://youtu.be/abc", "youtube.com/oembed"),
        ("https://www.tiktok.com/@wedo/video/123", "tiktok.com/oembed"),
    ],
)
def test_provider_metadata_uses_oembed_preview(
    url: str, expected_provider: str
) -> None:
    class FakeFetcher:
        requested_url: str | None = None

        def fetch_json(self, endpoint: str) -> dict[str, object]:
            self.requested_url = endpoint
            return {
                "title": "Video başlığı",
                "author_name": "WeDo",
                "thumbnail_url": "https://cdn.example.com/preview.jpg",
            }

    fetcher = FakeFetcher()
    metadata = resolve_provider_metadata(url, fetcher)

    assert expected_provider in (fetcher.requested_url or "")
    assert metadata == {
        "title": "Video başlığı",
        "description": "WeDo",
        "image_url": "https://cdn.example.com/preview.jpg",
    }
