import pytest
from app.db.url import sqlalchemy_database_url


@pytest.mark.parametrize(
    ("database_url", "expected"),
    [
        (
            "postgres://user:password@db:5432/wedo",
            "postgresql+psycopg://user:password@db:5432/wedo",
        ),
        (
            "postgresql://user:password@db:5432/wedo?sslmode=require",
            "postgresql+psycopg://user:password@db:5432/wedo?sslmode=require",
        ),
        ("sqlite:///local.db", "sqlite:///local.db"),
        (
            "postgresql+psycopg://user:password@db:5432/wedo",
            "postgresql+psycopg://user:password@db:5432/wedo",
        ),
    ],
)
def test_sqlalchemy_database_url_uses_psycopg(database_url: str, expected: str) -> None:
    assert sqlalchemy_database_url(database_url) == expected
