from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def sqlalchemy_database_url(database_url: str) -> str:
    """Use the installed Psycopg driver for standard PostgreSQL URLs."""
    for scheme in ("postgres://", "postgresql://"):
        if database_url.startswith(scheme):
            return f"postgresql+psycopg://{database_url.removeprefix(scheme)}"
    return database_url


engine = create_engine(
    sqlalchemy_database_url(str(settings.database_url)),
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_session() -> Generator[Session]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
