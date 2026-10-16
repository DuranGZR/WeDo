from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import jwt
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
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture
def google_token(monkeypatch):
    from app.modules.auth import service

    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    monkeypatch.setattr(settings, "google_web_client_id", "test-web-client")
    monkeypatch.setattr(
        service._google_jwks_client,
        "get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key=private_key.public_key()),
    )

    def create(overrides=None, *, trusted=True):
        now = datetime.now(UTC)
        claims = {
            "iss": "https://accounts.google.com",
            "aud": "test-web-client",
            "sub": "google-user-123",
            "iat": now,
            "exp": now + timedelta(minutes=5),
            "email": "googleuser@gmail.com",
            "email_verified": True,
            "name": "Google User",
        }
        claims.update(overrides or {})
        key = (
            private_key
            if trusted
            else rsa.generate_private_key(public_exponent=65537, key_size=2048)
        )
        return jwt.encode(claims, key, algorithm="RS256", headers={"kid": "test"})

    return create


@pytest.fixture
def client() -> TestClient:
    with TestClient(app, headers={"Accept-Language": "tr"}) as test_client:
        yield test_client


@pytest.fixture
def auth_client(monkeypatch) -> Generator[TestClient]:
    from app.modules.auth import verification

    messages = []
    monkeypatch.setattr(
        verification, "send_email", lambda **kwargs: messages.append(kwargs)
    )
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
        with TestClient(app, headers={"Accept-Language": "tr"}) as test_client:
            test_client.verification_messages = messages
            yield test_client
    finally:
        settings.metadata_enabled = previous_metadata_enabled
        settings.auth_rate_limit_per_minute = previous_auth_rate_limit
        app.dependency_overrides.clear()
        Base.metadata.drop_all(engine)
