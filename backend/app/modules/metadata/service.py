from urllib.parse import urlsplit
from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.items.enums import MetadataStatus
from app.modules.items.repository import item_repository
from app.modules.metadata.exceptions import MetadataError
from app.modules.metadata.fetcher import MetadataFetcher
from app.modules.metadata.parser import parse_metadata
from app.modules.metadata.providers import resolve_provider_metadata


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
        item.preview_image_url = metadata["image_url"] or provider_metadata["image_url"]
        item.canonical_url = metadata["canonical_url"] or resolved_url
        item.source_domain = _source_domain(item.canonical_url)
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
