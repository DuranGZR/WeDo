from collections.abc import Generator

import pytest
from app.api.dependencies import get_session
from app.core.config import settings
from app.db.base import Base
from app.main import app
from app.modules.activities.models import Activity  # noqa: F401
from app.modules.auth.models import AuthIdentity, RefreshSession  # noqa: F401
from app.modules.comments.models import Comment  # noqa: F401
from app.modules.invitations.models import Invitation  # noqa: F401
from app.modules.items.models import Item  # noqa: F401
from app.modules.lists.models import SpaceList  # noqa: F401
from app.modules.memories.models import Memory  # noqa: F401
from app.modules.notifications.models import DevicePushToken, Notification  # noqa: F401
from app.modules.plans.models import Plan, PlanReminder  # noqa: F401
from app.modules.reactions.models import ItemReaction  # noqa: F401
from app.modules.uploads.models import Upload  # noqa: F401
from app.modules.users.models import User  # noqa: F401
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_client() -> Generator[TestClient]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)

    def override_session() -> Generator[Session]:
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    previous_metadata_enabled = settings.metadata_enabled
    previous_auth_rate_limit = settings.auth_rate_limit_per_minute
    settings.metadata_enabled = False
    settings.auth_rate_limit_per_minute = 10_000
    app.dependency_overrides[get_session] = override_session
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        settings.metadata_enabled = previous_metadata_enabled
        settings.auth_rate_limit_per_minute = previous_auth_rate_limit
        app.dependency_overrides.clear()
        Base.metadata.drop_all(engine)
