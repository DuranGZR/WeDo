from types import SimpleNamespace

import pytest
from app.modules.items.enums import MetadataStatus
from app.modules.items.router import _needs_legacy_short_link_refresh
from app.modules.metadata.exceptions import MetadataError
from app.modules.metadata.parser import parse_metadata
from app.modules.metadata.providers import resolve_provider_metadata
from app.modules.metadata.security import validate_url
from app.modules.metadata.service import process_item_metadata


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


def test_metadata_processing_uses_the_resolved_short_link_destination(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    item = SimpleNamespace(
        original_url="https://ty.gl/example-product",
        metadata_status=MetadataStatus.PENDING,
        title=None,
        description=None,
        preview_image_url=None,
        canonical_url=None,
        source_domain="ty.gl",
        shared_text="Tişört",
    )

    class FakeFetcher:
        def fetch(self, url: str) -> SimpleNamespace:
            assert url == item.original_url
            return SimpleNamespace(
                url="https://www.trendyol.com/brand/tisort-p-123",
                text="""
                    <meta property=\"og:title\" content=\"Marka Tişört\">
                    <meta property=\"og:image\" content=\"https://cdn.example.com/tisort.jpg\">
                    <link rel=\"canonical\" href=\"/brand/tisort-p-123\">
                """,
            )

        def close(self) -> None:
            pass

    class FakeSession:
        committed = False

        def commit(self) -> None:
            self.committed = True

    session = FakeSession()
    monkeypatch.setattr(
        "app.modules.metadata.service.item_repository.get_by_id",
        lambda _session, _item_id: item,
    )

    process_item_metadata(session, item_id=object(), fetcher=FakeFetcher())

    assert item.metadata_status == MetadataStatus.COMPLETED
    assert item.source_domain == "www.trendyol.com"
    assert item.canonical_url == "https://www.trendyol.com/brand/tisort-p-123"
    assert item.preview_image_url == "https://cdn.example.com/tisort.jpg"
    assert session.committed is True


def test_completed_legacy_trendyol_short_links_are_retried_once() -> None:
    legacy_item = SimpleNamespace(
        metadata_status=MetadataStatus.COMPLETED,
        preview_image_url=None,
        source_domain="ty.gl",
    )
    completed_item_with_preview = SimpleNamespace(
        metadata_status=MetadataStatus.COMPLETED,
        preview_image_url="https://cdn.example.com/image.jpg",
        source_domain="ty.gl",
    )

    assert _needs_legacy_short_link_refresh(legacy_item) is True
    assert _needs_legacy_short_link_refresh(completed_item_with_preview) is False
