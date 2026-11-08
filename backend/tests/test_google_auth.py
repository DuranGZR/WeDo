from datetime import UTC, datetime, timedelta

import pytest
from app.api.dependencies import get_session
from app.core.config import settings
from app.main import app
from app.modules.auth import service
from app.modules.users.models import User

from tests.helpers import verified_sign_up


@pytest.mark.parametrize("environment", ["development", "production"])
def test_google_rejects_demo_tokens(auth_client, monkeypatch, environment):
    monkeypatch.setattr(settings, "environment", environment)
    monkeypatch.setattr(settings, "google_web_client_id", "test-web-client")
    response = auth_client.post(
        "/api/v1/auth/google",
        json={"id_token": "google-auth-token", "email": "victim@example.com"},
    )
    assert response.status_code == 401


@pytest.mark.parametrize(
    "overrides",
    [
        {"aud": "another-client"},
        {"iss": "https://attacker.example.com"},
        {"exp": datetime.now(UTC) - timedelta(minutes=5)},
        {"iat": datetime.now(UTC) + timedelta(hours=1)},
        {"email_verified": False},
        {"email_verified": "true"},
        {"email": None},
        {"email": "invalid"},
        {"sub": ""},
        {"exp": None},
    ],
)
def test_google_rejects_invalid_claims(auth_client, google_token, overrides):
    response = auth_client.post(
        "/api/v1/auth/google", json={"id_token": google_token(overrides)}
    )
    assert response.status_code == 401


def test_google_rejects_forged_signature(auth_client, google_token):
    response = auth_client.post(
        "/api/v1/auth/google", json={"id_token": google_token(trusted=False)}
    )
    assert response.status_code == 401


def test_google_fails_closed_when_not_configured(auth_client, monkeypatch):
    monkeypatch.setattr(settings, "google_web_client_id", "")
    assert (
        auth_client.post(
            "/api/v1/auth/google", json={"id_token": "anything"}
        ).status_code
        == 401
    )


def test_google_key_service_failure_returns_auth_error(
    auth_client, google_token, monkeypatch
):
    import jwt

    token = google_token()

    def unavailable(token):
        raise jwt.PyJWKClientConnectionError("offline")

    monkeypatch.setattr(
        service._google_jwks_client, "get_signing_key_from_jwt", unavailable
    )
    assert (
        auth_client.post("/api/v1/auth/google", json={"id_token": token}).status_code
        == 401
    )


def test_google_does_not_link_third_party_email(auth_client, google_token):
    verified_sign_up(
        auth_client,
        "/api/v1/auth/sign-up",
        json={
            "email": "existing@example.com",
            "password": "Correct-horse-battery-staple1",
            "display_name": "Existing User",
        },
    )
    response = auth_client.post(
        "/api/v1/auth/google",
        json={"id_token": google_token({"email": "existing@example.com"})},
    )
    assert response.status_code == 401


def test_google_does_not_link_inactive_account(auth_client, google_token):
    generator = app.dependency_overrides[get_session]()
    try:
        session = next(generator)
        session.add(
            User(email="googleuser@gmail.com", display_name="Inactive", is_active=False)
        )
        session.commit()
    finally:
        generator.close()
    assert (
        auth_client.post(
            "/api/v1/auth/google", json={"id_token": google_token()}
        ).status_code
        == 401
    )


def test_google_does_not_activate_the_unverified_password(auth_client, google_token):
    login = {"email": "googleuser@gmail.com", "password": "Unverified-Password1"}
    pending = auth_client.post(
        "/api/v1/auth/sign-up", json={**login, "display_name": "Unverified name"}
    )
    assert pending.status_code == 201
    google = auth_client.post("/api/v1/auth/google", json={"id_token": google_token()})
    assert google.status_code == 200
    assert google.json()["user"]["has_password"] is False
    assert auth_client.post("/api/v1/auth/sign-in", json=login).status_code == 401
    assert (
        auth_client.post(
            "/api/v1/auth/resend-verification",
            json={"verification_id": pending.json()["verification_id"]},
        ).status_code
        == 400
    )


def test_google_requires_an_authenticated_link_for_verified_accounts(
    auth_client, google_token
):
    login = {"email": "googleuser@gmail.com", "password": "Verified-Password1"}
    verified_sign_up(
        auth_client,
        "/api/v1/auth/sign-up",
        json={**login, "display_name": "Verified User"},
    )
    payload = {"id_token": google_token()}
    assert auth_client.post("/api/v1/auth/google", json=payload).status_code == 401
    assert auth_client.post("/api/v1/auth/link/google", json=payload).status_code == 401
    password_session = auth_client.post("/api/v1/auth/sign-in", json=login).json()
    headers = {"Authorization": f"Bearer {password_session['access_token']}"}
    wrong_account = {"id_token": google_token({"email": "someoneelse@gmail.com"})}
    assert (
        auth_client.post(
            "/api/v1/auth/link/google", headers=headers, json=wrong_account
        ).status_code
        == 401
    )
    linked = auth_client.post("/api/v1/auth/link/google", headers=headers, json=payload)
    assert linked.status_code == 200
    assert linked.json()["user"]["id"] == password_session["user"]["id"]
    assert linked.json()["user"]["has_password"] is True
    assert auth_client.post("/api/v1/auth/google", json=payload).status_code == 200
