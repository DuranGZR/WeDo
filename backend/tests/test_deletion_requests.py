from unittest.mock import MagicMock

import httpx
import pytest
from app.core import mail as delivery
from app.core.config import settings
from pydantic import SecretStr

from tests.helpers import verified_sign_up


@pytest.fixture
def mail(monkeypatch):
    monkeypatch.setattr(settings, "resend_api_key", SecretStr("test-only-api-key"))
    response = httpx.Response(
        200,
        json={"id": "test-message"},
        request=httpx.Request("POST", "https://api.resend.com/emails"),
    )
    post = MagicMock(return_value=response)
    monkeypatch.setattr(delivery.httpx, "post", post)
    return post


def test_deletion_request_delivered_to_fixed_support_address(auth_client, mail):
    response = auth_client.post(
        "/legal/deletion-requests",
        json={"email": "user@example.com", "reason": "Lütfen hesabımı silin."},
    )
    assert response.status_code == 202
    assert "doğrulandıktan" in response.json()["message"]
    mail.assert_called_once()
    assert mail.call_args.args[0] == "https://api.resend.com/emails"
    payload = mail.call_args.kwargs["json"]
    assert payload["to"] == ["contact@durangezer.com"]
    assert payload["reply_to"] == "user@example.com"
    assert "Lütfen hesabımı silin." in payload["text"]
    assert "hesap sahibi" in payload["text"]
    assert mail.call_args.kwargs["timeout"] == 10


@pytest.mark.parametrize("status", [401, 403, 429, 500])
def test_provider_failure_does_not_claim_success(auth_client, mail, status):
    mail.return_value = httpx.Response(
        status,
        text="private-provider-details",
        request=httpx.Request("POST", "https://api.resend.com/emails"),
    )
    response = auth_client.post(
        "/legal/deletion-requests", json={"email": "unknown@example.com"}
    )
    assert response.status_code == 503
    assert "contact@durangezer.com" in response.text
    assert "private-provider-details" not in response.text


@pytest.mark.parametrize("result", [{}, [], {"error": "rejected"}])
def test_unaccepted_email_is_a_failure(auth_client, mail, result):
    mail.return_value = httpx.Response(
        200, json=result, request=httpx.Request("POST", "https://api.resend.com/emails")
    )
    assert (
        auth_client.post(
            "/legal/deletion-requests", json={"email": "user@example.com"}
        ).status_code
        == 503
    )


def test_delivery_timeout_does_not_claim_success(auth_client, mail):
    mail.side_effect = httpx.ReadTimeout("private-provider-details")
    response = auth_client.post(
        "/legal/deletion-requests", json={"email": "user@example.com"}
    )
    assert response.status_code == 503
    assert "private-provider-details" not in response.text


def test_unconfigured_delivery_is_not_success(auth_client, monkeypatch):
    monkeypatch.setattr(settings, "resend_api_key", SecretStr(""))
    assert (
        auth_client.post(
            "/legal/deletion-requests", json={"email": "user@example.com"}
        ).status_code
        == 503
    )


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"email": "invalid"},
        {"email": "user@example.com\r\nBcc: victim@example.com"},
        {"email": "user@example.com", "reason": "x" * 2001},
    ],
)
def test_invalid_requests_do_not_send_email(auth_client, mail, payload):
    connection = mail
    assert auth_client.post("/legal/deletion-requests", json=payload).status_code == 422
    connection.assert_not_called()


def test_request_does_not_delete_account_or_reveal_membership(auth_client, mail):
    verified_sign_up(auth_client, "/api/v1/auth/sign-up",
        json={
            "email": "user@example.com",
            "password": "Correct-horse-battery-staple1",
            "display_name": "Existing User",
        },
    )
    responses = [
        auth_client.post("/legal/deletion-requests", json={"email": email})
        for email in ["user@example.com", "unknown@example.com"]
    ]
    assert responses[0].status_code == responses[1].status_code == 202
    assert responses[0].json() == responses[1].json()
    assert (
        auth_client.post(
            "/api/v1/auth/sign-in",
            json={
                "email": "user@example.com",
                "password": "Correct-horse-battery-staple1",
            },
        ).status_code
        == 200
    )


def test_support_and_google_privacy_are_published(auth_client):
    response = auth_client.get("/legal")
    assert "contact@durangezer.com" in response.text
    assert "destek@wedo.app" not in response.text
    assert "Google ile Giriş" in response.text
    assert "fetch('/legal/deletion-requests'" in response.text
    assert "Doğrulama e-postası kayıtlı adresinize gönderilecek" not in response.text


def test_deletion_request_is_rate_limited(auth_client, mail, monkeypatch):
    monkeypatch.setattr(settings, "auth_rate_limit_per_minute", 1)
    headers = {"X-Forwarded-For": "198.51.100.73"}
    # The test client host is not a proxy; use a distinct path bucket for this test.
    from app.main import app

    current = app.middleware_stack
    while current:
        if hasattr(current, "requests"):
            current.requests.clear()
        current = getattr(current, "app", None)
    first = auth_client.post(
        "/legal/deletion-requests", json={"email": "user@example.com"}, headers=headers
    )
    second = auth_client.post(
        "/legal/deletion-requests", json={"email": "user@example.com"}, headers=headers
    )
    assert first.status_code == 202
    assert second.status_code == 429
    assert second.headers["Retry-After"] == "60"
