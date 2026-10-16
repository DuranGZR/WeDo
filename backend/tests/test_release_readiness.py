import pytest
from app.api.dependencies import get_session
from app.main import app
from app.modules.auth.service import _issue_tokens
from app.modules.notifications.models import DevicePushToken
from app.modules.users.models import User
from sqlalchemy import select


@pytest.fixture
def accounts(auth_client):
    generator = app.dependency_overrides[get_session]()
    session = next(generator)
    users = []
    for name in ("alice", "bob"):
        user = User(email=f"{name}@example.com", display_name=name, email_verified=True)
        session.add(user)
        session.flush()
        tokens = _issue_tokens(session, user, None)
        users.append((user, {"Authorization": f"Bearer {tokens.access_token}"}))
    session.commit()
    yield auth_client, session, users
    generator.close()


def test_push_token_moves_to_new_account_and_logout_removes_it(accounts):
    client, session, users = accounts
    payload = {
        "device_id": "same-iphone",
        "platform": "ios",
        "push_token": "ExponentPushToken[same-install]",
    }
    assert (
        client.post("/api/v1/devices", headers=users[0][1], json=payload).status_code
        == 201
    )
    assert (
        client.post("/api/v1/devices", headers=users[1][1], json=payload).status_code
        == 201
    )
    session.expire_all()
    devices = session.scalars(select(DevicePushToken)).all()
    assert len(devices) == 1 and devices[0].user_id == users[1][0].id
    assert (
        client.post("/api/v1/auth/sign-out-all", headers=users[1][1]).status_code == 204
    )
    session.expire_all()
    assert session.scalar(select(DevicePushToken)) is None


def test_inactive_account_cannot_refresh(accounts):
    client, session, users = accounts
    user = users[0][0]
    tokens = _issue_tokens(session, user, None)
    user.is_active = False
    session.commit()
    response = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens.refresh_token}
    )
    assert response.status_code == 401
