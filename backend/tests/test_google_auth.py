from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest
from app.core.config import settings
from app.modules.auth import service


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
    auth_client.post(
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


def test_google_does_not_link_inactive_account(auth_client, google_token, monkeypatch):
    token = google_token()
    monkeypatch.setattr(
        service.user_repository,
        "get_by_email",
        lambda *args: SimpleNamespace(is_active=False),
    )
    assert (
        auth_client.post("/api/v1/auth/google", json={"id_token": token}).status_code
        == 401
    )
