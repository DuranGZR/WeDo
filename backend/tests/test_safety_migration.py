import importlib.util
from pathlib import Path

from alembic.migration import MigrationContext
from alembic.operations import Operations
from app.db.base import Base
from app.modules.safety.models import ContentReport, UserBlock
from app.modules.users.models import User
from sqlalchemy import create_engine, inspect, select


def test_safety_migration_roundtrip_preserves_existing_accounts():
    # An isolated in-memory DB, never the developer's configured DATABASE_URL.
    engine = create_engine("sqlite://")
    path = (
        Path(__file__).resolve().parents[1]
        / "migrations/versions/0017_content_safety.py"
    )
    spec = importlib.util.spec_from_file_location("safety_migration", path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    with engine.begin() as connection:
        Base.metadata.create_all(connection)
        connection.execute(
            User.__table__.insert().values(
                email="preserve@example.com", display_name="Existing User"
            )
        )
        for model in (ContentReport, UserBlock):
            model.__table__.drop(connection)
        migration.op = Operations(MigrationContext.configure(connection))
        for _ in range(2):
            migration.upgrade()
            inspector = inspect(connection)
            for model in (ContentReport, UserBlock):
                columns = {
                    column["name"]
                    for column in inspector.get_columns(model.__tablename__)
                }
                assert columns == set(model.__table__.columns.keys())
                indexes = {
                    index["name"]
                    for index in inspector.get_indexes(model.__tablename__)
                }
                assert indexes == {index.name for index in model.__table__.indexes}
            assert connection.scalar(select(User.email)) == "preserve@example.com"
            migration.downgrade()
            assert "user_blocks" not in inspect(connection).get_table_names()
            assert "content_reports" not in inspect(connection).get_table_names()
            assert connection.scalar(select(User.email)) == "preserve@example.com"
