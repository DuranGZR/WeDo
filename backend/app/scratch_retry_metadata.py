import os
import sys

# Add project root to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import all models to resolve SQLAlchemy foreign key mappings
from app.db.session import SessionLocal
from app.modules.items.models import Item
from app.modules.metadata.fetcher import MetadataFetcher
from app.modules.metadata.service import process_item_metadata


def main():
    session = SessionLocal()
    fetcher = MetadataFetcher()
    try:
        items = session.query(Item).filter(Item.deleted_at.is_(None)).all()
        print(f"Found {len(items)} items to process.")
        for item in items:
            if not item.original_url:
                continue
            print(f"Processing item {item.id}: {item.original_url}")
            process_item_metadata(session, item.id, fetcher=fetcher)
        session.commit()
        print("Scraping retry task completed successfully!")
    except Exception as e:
        session.rollback()
        print(f"Error occurred: {e}")
    finally:
        fetcher.close()
        session.close()

if __name__ == "__main__":
    main()
