from io import BytesIO
from urllib.parse import urlsplit
from uuid import UUID

from PIL import Image
from sqlalchemy.orm import Session

from app.modules.items.enums import MetadataStatus
from app.modules.items.repository import item_repository
from app.modules.metadata.exceptions import MetadataError
from app.modules.metadata.fetcher import MetadataFetcher
from app.modules.metadata.parser import parse_metadata
from app.modules.metadata.providers import resolve_provider_metadata


def is_expiring_cdn(url: str | None) -> bool:
    if not url:
        return False
    low = url.lower()
    return (
        any(
            host in low
            for host in (
                "cdninstagram.com",
                "fbcdn.net",
                "instagram.com",
                "tiktokcdn.com",
            )
        )
        or "oe=" in low
        or "x-expires=" in low
    )


def optimize_preview_image(data: bytes, max_size=(600, 600)) -> tuple[bytes, str]:
    img = Image.open(BytesIO(data))
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    img.thumbnail(max_size, Image.Resampling.LANCZOS)
    buffer = BytesIO()
    img.save(buffer, format="JPEG", quality=82, optimize=True)
    return buffer.getvalue(), "image/jpeg"


def _source_domain(url: str) -> str | None:
    """Return a normalized host for the URL users will actually visit."""
    return urlsplit(url).hostname


def process_item_metadata(
    session: Session, item_id: UUID, fetcher: MetadataFetcher | None = None
) -> None:
    item = item_repository.get_by_id(session, item_id)
    if item is None or not item.original_url:
        return
    owns_fetcher = fetcher is None
    active_fetcher = fetcher or MetadataFetcher()
    item.metadata_status = MetadataStatus.PROCESSING
    try:
        response = active_fetcher.fetch(item.original_url)
        resolved_url = response.url
        metadata = parse_metadata(response.text, base_url=resolved_url)
        provider_metadata = resolve_provider_metadata(resolved_url, active_fetcher)
        item.title = (
            item.title
            or metadata["title"]
            or provider_metadata["title"]
            or item.shared_text
        )
        item.description = (
            item.description
            or metadata["description"]
            or provider_metadata["description"]
        )
        raw_image_url = (
            metadata["image_url"]
            or provider_metadata["image_url"]
            or item.preview_image_url
        )
        item.canonical_url = metadata["canonical_url"] or resolved_url
        item.source_domain = _source_domain(item.canonical_url)

        # Permanent caching for expiring CDN URLs (Instagram, Facebook, TikTok, etc.)
        if raw_image_url and is_expiring_cdn(raw_image_url):
            try:
                img_resp = active_fetcher.fetch(raw_image_url)
                if (
                    img_resp
                    and hasattr(img_resp, "content")
                    and len(img_resp.content) > 100
                ):
                    optimized_bytes, content_type = optimize_preview_image(
                        img_resp.content
                    )
                    from app.modules.items.models import ItemPreviewImage

                    preview_record = session.get(ItemPreviewImage, item.id)
                    if preview_record is None:
                        preview_record = ItemPreviewImage(
                            item_id=item.id,
                            data=optimized_bytes,
                            content_type=content_type,
                        )
                        session.add(preview_record)
                    else:
                        preview_record.data = optimized_bytes
                        preview_record.content_type = content_type

                    item.preview_image_url = f"/api/v1/items/{item.id}/preview"
                else:
                    item.preview_image_url = raw_image_url
            except Exception:
                item.preview_image_url = raw_image_url
        else:
            item.preview_image_url = raw_image_url

        item.metadata_status = MetadataStatus.COMPLETED
    except MetadataError:
        item.metadata_status = MetadataStatus.FAILED
    finally:
        if owns_fetcher:
            active_fetcher.close()
        session.commit()


def run_item_metadata_task(item_id: UUID) -> None:
    from app.db.session import SessionLocal

    session = SessionLocal()
    try:
        process_item_metadata(session, item_id)
    except Exception:
        session.rollback()
    finally:
        session.close()
