import re
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from app.api.dependencies import get_session
from app.core.mail import EmailDeliveryError
from app.main import app
from app.modules.auth import verification
from app.modules.auth.models import EmailVerification
from app.modules.users.models import User
from sqlalchemy import select

PAYLOAD = {
    "email": "owner@example.com",
    "password": "Correct-horse-battery-staple1",
    "display_name": "Owner",
}


@pytest.fixture
def db(auth_client):
    generator = app.dependency_overrides[get_session]()
    session = next(generator)
    try:
        yield session
    finally:
        generator.close()


def register(client):
    response = client.post("/api/v1/auth/sign-up", json=PAYLOAD)
    assert response.status_code == 201
    return response.json()["verification_id"]


def code(client):
    return re.search(r"kodun: ([0-9]{6})", client.verification_messages[-1]["text"])[1]


def confirm(client, challenge_id, value=None):
    return client.post(
        "/api/v1/auth/verify-email",
        json={
            "verification_id": challenge_id,
            "code": value or code(client),
        },
    )


def test_signup_requires_confirmation_and_code_is_single_use(auth_client, db):
    challenge_id = register(auth_client)
    entry = db.scalar(select(EmailVerification))
    assert code(auth_client) not in entry.code_hash
    assert len(entry.code_hash) == 64
    assert db.scalar(select(User)).email_verified is False
    assert (
        "access_token"
        not in auth_client.post("/api/v1/auth/sign-in", json=PAYLOAD).json()
    )
    pending = auth_client.post("/api/v1/auth/sign-in", json=PAYLOAD)
    assert pending.status_code == 403
    assert pending.json()["error"]["code"] == "EMAIL_VERIFICATION_REQUIRED"
    assert pending.json()["error"]["details"]["verification_id"] == challenge_id
    assert len(auth_client.verification_messages) == 1
    assert confirm(auth_client, challenge_id).status_code == 204
    assert confirm(auth_client, challenge_id).status_code == 400
    assert auth_client.post("/api/v1/auth/sign-in", json=PAYLOAD).status_code == 200


def test_wrong_password_does_not_send_or_expose_challenge(auth_client):
    register(auth_client)
    response = auth_client.post(
        "/api/v1/auth/sign-in",
        json={
            **PAYLOAD,
            "password": "Wrong-password123",
        },
    )
    assert response.status_code == 401
    assert "verification_id" not in response.text
    assert len(auth_client.verification_messages) == 1


def test_expired_code_and_unknown_id_are_rejected(auth_client, db):
    challenge_id = register(auth_client)
    entry = db.scalar(select(EmailVerification))
    entry.expires_at = datetime.now(UTC) - timedelta(seconds=1)
    db.commit()
    assert confirm(auth_client, challenge_id).status_code == 400
    assert confirm(auth_client, str(uuid4())).status_code == 400


def test_five_failed_attempts_lock_code(auth_client, monkeypatch):
    monkeypatch.setattr(verification.secrets, "randbelow", lambda _: 123456)
    challenge_id = register(auth_client)
    for _ in range(5):
        assert confirm(auth_client, challenge_id, "999999").status_code == 400
    assert confirm(auth_client, challenge_id, "123456").status_code == 400


def test_resend_cooldown_and_old_code_invalidation(auth_client, db, monkeypatch):
    monkeypatch.setattr(verification.secrets, "randbelow", lambda _: 123456)
    challenge_id = register(auth_client)
    response = auth_client.post(
        "/api/v1/auth/resend-verification",
        json={
            "verification_id": challenge_id,
        },
    )
    assert response.status_code == 200
    assert response.json()["resend_after_seconds"] > 0
    assert len(auth_client.verification_messages) == 1
    entry = db.scalar(select(EmailVerification))
    entry.sent_at = datetime.now(UTC) - timedelta(seconds=61)
    db.commit()
    monkeypatch.setattr(verification.secrets, "randbelow", lambda _: 654321)
    response = auth_client.post(
        "/api/v1/auth/resend-verification",
        json={
            "verification_id": challenge_id,
        },
    )
    assert response.status_code == 200
    assert len(auth_client.verification_messages) == 2
    assert confirm(auth_client, challenge_id, "123456").status_code == 400
    assert confirm(auth_client, challenge_id, "654321").status_code == 204


def test_mail_failure_rolls_back_signup(auth_client, monkeypatch):
    def unavailable(**kwargs):
        raise EmailDeliveryError("private provider details")

    monkeypatch.setattr(verification, "send_email", unavailable)
    for _ in range(2):
        response = auth_client.post("/api/v1/auth/sign-up", json=PAYLOAD)
        assert response.status_code == 503
        assert "private provider details" not in response.text


def test_failed_resend_preserves_previous_code(auth_client, db, monkeypatch):
    challenge_id = register(auth_client)
    old_code = code(auth_client)
    entry = db.scalar(select(EmailVerification))
    entry.sent_at = datetime.now(UTC) - timedelta(seconds=61)
    db.commit()

    def unavailable(**kwargs):
        raise EmailDeliveryError("offline")

    monkeypatch.setattr(verification, "send_email", unavailable)
    assert (
        auth_client.post(
            "/api/v1/auth/resend-verification",
            json={
                "verification_id": challenge_id,
            },
        ).status_code
        == 503
    )
    assert confirm(auth_client, challenge_id, old_code).status_code == 204


def test_legacy_account_gets_confirmation_on_login(auth_client, db):
    from app.modules.auth.passwords import hash_password

    db.add(
        User(
            email=PAYLOAD["email"],
            display_name="Legacy",
            password_hash=hash_password(PAYLOAD["password"]),
        )
    )
    db.commit()
    response = auth_client.post("/api/v1/auth/sign-in", json=PAYLOAD)
    assert response.status_code == 403
    challenge_id = response.json()["error"]["details"]["verification_id"]
    assert confirm(auth_client, challenge_id).status_code == 204
    assert auth_client.post("/api/v1/auth/sign-in", json=PAYLOAD).status_code == 200


@pytest.mark.parametrize("value", ["12345", "1234567", "abcdef", "１２３４５６"])
def test_code_format_is_validated(auth_client, value):
    challenge_id = register(auth_client)
    assert confirm(auth_client, challenge_id, value).status_code == 422


def test_confirmed_account_cannot_resend(auth_client):
    challenge_id = register(auth_client)
    assert confirm(auth_client, challenge_id).status_code == 204
    assert (
        auth_client.post(
            "/api/v1/auth/resend-verification",
            json={
                "verification_id": challenge_id,
            },
        ).status_code
        == 400
    )


def test_access_and_refresh_cannot_bypass_unverified_flag(auth_client, db):
    challenge_id = register(auth_client)
    confirm(auth_client, challenge_id)
    tokens = auth_client.post("/api/v1/auth/sign-in", json=PAYLOAD).json()
    user = db.scalar(select(User))
    user.email_verified = False
    db.commit()
    assert (
        auth_client.get(
            "/api/v1/users/me",
            headers={
                "Authorization": f"Bearer {tokens['access_token']}",
            },
        ).status_code
        == 401
    )
    assert (
        auth_client.post(
            "/api/v1/auth/refresh",
            json={
                "refresh_token": tokens["refresh_token"],
            },
        ).status_code
        == 401
    )
