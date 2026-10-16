import asyncio
import json
import threading
import time
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from uuid import UUID, uuid4

import httpx
import jwt
import pytest
from app.api.dependencies import get_session
from app.core.config import settings
from app.main import app
from app.modules.auth import apple
from app.modules.auth.apple_lifecycle import process_revocations
from app.modules.auth.models import AppleNotification, AppleRevocation, AuthIdentity
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa
from pydantic import SecretStr
from sqlalchemy import select


@pytest.fixture
def apple_server(monkeypatch):
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    client_key = ec.generate_private_key(ec.SECP256R1())
    pem = client_key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    ).decode()
    monkeypatch.setattr(settings, "apple_team_id", "TESTTEAM01")
    monkeypatch.setattr(settings, "apple_key_id", "TESTKEY001")
    monkeypatch.setattr(settings, "apple_private_key", SecretStr(pem))
    monkeypatch.setattr(
        settings,
        "apple_token_encryption_key",
        SecretStr(Fernet.generate_key().decode()),
    )
    monkeypatch.setattr(
        apple.jwks,
        "get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key=private_key.public_key()),
    )
    calls = []
    state = {"revoke_status": 200, "exchange_sub": "apple-person"}

    def token(overrides=None, *, notification=False, trusted=True):
        now = int(time.time())
        claims = {
            "iss": apple.APPLE_ISSUER,
            "aud": settings.apple_bundle_id,
            "iat": now,
        }
        if notification:
            claims.update(
                {
                    "jti": str(uuid4()),
                    "events": {
                        "type": "consent-revoked",
                        "sub": "apple-person",
                        "event_time": now,
                    },
                }
            )
        else:
            claims.update(
                {
                    "sub": "apple-person",
                    "exp": now + 600,
                    "auth_time": now - 60,
                    "email": "relay@privaterelay.appleid.com",
                    "email_verified": "true",
                }
            )
        claims.update(overrides or {})
        key = (
            private_key
            if trusted
            else rsa.generate_private_key(public_exponent=65537, key_size=2048)
        )
        return jwt.encode(claims, key, algorithm="RS256", headers={"kid": "apple-test"})

    def post(url, *, data, **kwargs):
        calls.append((url, data))
        # Verify our outgoing ES256 client secret using a separate public key.
        claims = jwt.decode(
            data["client_secret"],
            client_key.public_key(),
            algorithms=["ES256"],
            audience=apple.APPLE_ISSUER,
            issuer="TESTTEAM01",
        )
        assert claims["sub"] == settings.apple_bundle_id
        assert jwt.get_unverified_header(data["client_secret"])["kid"] == "TESTKEY001"
        if url.endswith("/auth/token"):
            return httpx.Response(
                200,
                json={
                    "id_token": token({"sub": state["exchange_sub"]}),
                    "refresh_token": "apple-refresh-secret",
                },
            )
        assert url.endswith("/auth/revoke")
        assert data["token"] == "apple-refresh-secret"
        assert data["token_type_hint"] == "refresh_token"
        return httpx.Response(state["revoke_status"])

    monkeypatch.setattr(apple.httpx, "post", post)
    return SimpleNamespace(token=token, calls=calls, state=state)


def session():
    return app.dependency_overrides[get_session]()


def login(client, server, **extra):
    return client.post(
        "/api/v1/auth/apple",
        json={
            "identity_token": server.token(),
            "apple_user_id": "apple-person",
            "authorization_code": "single-use-code",
            **extra,
        },
    )


def notify(client, server, kind, *, when=None, jti=None, **claims):
    event = {
        "type": kind,
        "sub": "apple-person",
        "event_time": when if when is not None else int(time.time()),
    }
    overrides = {"events": event, **claims}
    if jti:
        overrides["jti"] = jti
    return client.post(
        "/api/v1/auth/apple/notifications",
        json={"payload": server.token(overrides, notification=True)},
    )


def test_exchange_stores_only_encrypted_refresh_token(auth_client, apple_server):
    response = login(auth_client, apple_server)
    assert response.status_code == 200
    assert "apple-refresh-secret" not in response.text
    gen = session()
    db = next(gen)
    identity = db.scalar(select(AuthIdentity))
    assert identity.apple_refresh_token != "apple-refresh-secret"
    assert (
        apple.cipher().decrypt(identity.apple_refresh_token.encode())
        == b"apple-refresh-secret"
    )
    gen.close()


@pytest.mark.parametrize(
    "overrides",
    [
        {"aud": "other-app"},
        {"iss": "https://attacker.test"},
        {"exp": 1},
        {"sub": "other-person"},
        {"email_verified": False},
    ],
)
def test_invalid_identity_claims_rejected(auth_client, apple_server, overrides):
    response = auth_client.post(
        "/api/v1/auth/apple",
        json={
            "identity_token": apple_server.token(overrides),
            "apple_user_id": "apple-person",
            "authorization_code": "code",
        },
    )
    assert response.status_code == 401


def test_forged_signature_and_unsigned_legacy_development_tokens_rejected(
    auth_client, apple_server
):
    for token in [
        apple_server.token(trusted=False),
        jwt.encode(
            {"sub": "apple-person"},
            "dummy-test-key-that-is-long-enough",
            algorithm="HS256",
        ),
    ]:
        assert (
            auth_client.post(
                "/api/v1/auth/apple",
                json={"identity_token": token, "apple_user_id": "apple-person"},
            ).status_code
            == 401
        )


def test_code_subject_must_match_identity_and_no_user_created(
    auth_client, apple_server
):
    apple_server.state["exchange_sub"] = "different-person"
    assert login(auth_client, apple_server).status_code == 401
    gen = session()
    db = next(gen)
    assert db.scalar(select(AuthIdentity)) is None
    gen.close()


def test_missing_crypto_key_does_not_consume_code(
    auth_client, apple_server, monkeypatch
):
    monkeypatch.setattr(settings, "apple_token_encryption_key", SecretStr(""))
    assert login(auth_client, apple_server).status_code == 503
    assert not apple_server.calls


def test_production_requires_authorization_code(auth_client, apple_server, monkeypatch):
    monkeypatch.setattr(settings, "environment", "production")
    assert (
        auth_client.post(
            "/api/v1/auth/apple",
            json={
                "identity_token": apple_server.token(),
                "apple_user_id": "apple-person",
            },
        ).status_code
        == 401
    )


def test_delete_revokes_and_revokes_wedo_sessions(auth_client, apple_server):
    login_data = login(auth_client, apple_server).json()
    headers = {"Authorization": "Bearer " + login_data["access_token"]}
    response = auth_client.request(
        "DELETE", "/api/v1/users/me", json={}, headers=headers
    )
    assert response.status_code == 200
    assert response.json()["apple_revocation"] == "pending"
    assert auth_client.get("/api/v1/users/me", headers=headers).status_code == 401
    assert (
        len([url for url, _ in apple_server.calls if url.endswith("/auth/revoke")]) == 1
    )
    gen = session()
    db = next(gen)
    assert db.scalar(select(AuthIdentity)) is None
    assert db.scalar(select(AppleRevocation)) is None
    gen.close()


def test_revocation_failure_retains_encrypted_job_and_worker_retries(
    auth_client, apple_server
):
    data = login(auth_client, apple_server).json()
    apple_server.state["revoke_status"] = 503
    assert (
        auth_client.request(
            "DELETE",
            "/api/v1/users/me",
            json={},
            headers={"Authorization": "Bearer " + data["access_token"]},
        ).status_code
        == 200
    )
    gen = session()
    db = next(gen)
    job = db.scalar(select(AppleRevocation))
    assert job and job.attempts == 1 and job.encrypted_token != "apple-refresh-secret"
    assert process_revocations(db) == 0  # Cooldown is respected.
    job.next_attempt_at = datetime.now(UTC) - timedelta(seconds=1)
    db.commit()
    apple_server.state["revoke_status"] = 200
    assert process_revocations(db) == 1
    assert db.scalar(select(AppleRevocation)) is None
    gen.close()


def test_email_changes_are_idempotent_and_ordered(auth_client, apple_server):
    data = login(auth_client, apple_server).json()
    now = int(time.time())
    assert (
        notify(
            auth_client, apple_server, "email-disabled", when=now, jti="same-event"
        ).status_code
        == 200
    )
    assert (
        notify(
            auth_client, apple_server, "email-disabled", when=now, jti="same-event"
        ).status_code
        == 200
    )
    assert (
        notify(auth_client, apple_server, "email-enabled", when=now - 10).status_code
        == 200
    )
    response = auth_client.get(
        "/api/v1/users/me", headers={"Authorization": "Bearer " + data["access_token"]}
    )
    assert response.json()["apple_email_forwarding_enabled"] is False
    gen = session()
    db = next(gen)
    assert len(db.scalars(select(AppleNotification)).all()) == 2
    gen.close()


@pytest.mark.parametrize("kind", ["consent-revoked", "account-deleted"])
def test_revocation_events_end_active_sessions(auth_client, apple_server, kind):
    data = login(auth_client, apple_server).json()
    assert notify(auth_client, apple_server, kind).status_code == 200
    assert (
        auth_client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer " + data["access_token"]},
        ).status_code
        == 401
    )
    if kind == "consent-revoked":
        assert login(auth_client, apple_server).status_code == 401


def test_notification_validation_never_accepts_wrong_audience_or_malformed_events(
    auth_client, apple_server
):
    assert (
        notify(
            auth_client, apple_server, "consent-revoked", aud="wrong-app"
        ).status_code
        == 401
    )
    assert (
        notify(
            auth_client, apple_server, "consent-revoked", when=int(time.time()) + 1000
        ).status_code
        == 401
    )
    payload = apple_server.token({"events": "broken-json"}, notification=True)
    assert (
        auth_client.post(
            "/api/v1/auth/apple/notifications", json={"payload": payload}
        ).status_code
        == 401
    )
    payload = apple_server.token(
        {
            "events": json.dumps(
                {
                    "type": "email-enabled",
                    "sub": "unknown",
                    "event_time": int(time.time()),
                }
            )
        },
        notification=True,
    )
    assert (
        auth_client.post(
            "/api/v1/auth/apple/notifications", json={"payload": payload}
        ).status_code
        == 200
    )


def test_delayed_revocation_does_not_end_newer_authorization(auth_client, apple_server):
    data = login(auth_client, apple_server).json()
    assert (
        notify(
            auth_client, apple_server, "consent-revoked", when=int(time.time()) - 120
        ).status_code
        == 200
    )
    assert (
        auth_client.get(
            "/api/v1/users/me",
            headers={"Authorization": "Bearer " + data["access_token"]},
        ).status_code
        == 200
    )


def test_unavailable_apple_keys_returns_retryable_notification_status(
    auth_client, apple_server, monkeypatch
):
    def unavailable(token):
        raise jwt.PyJWKClientConnectionError("Offline test")

    monkeypatch.setattr(apple.jwks, "get_signing_key_from_jwt", unavailable)
    assert notify(auth_client, apple_server, "consent-revoked").status_code == 503


def test_account_deleted_preserves_independent_google_membership(
    auth_client, apple_server
):
    data = login(auth_client, apple_server).json()
    gen = session()
    db = next(gen)
    identity = db.scalar(select(AuthIdentity))
    db.add(
        AuthIdentity(
            user_id=identity.user_id,
            provider="google",
            provider_user_id="google-person",
            provider_email="person@gmail.com",
        )
    )
    db.commit()
    gen.close()
    assert notify(auth_client, apple_server, "account-deleted").status_code == 200
    gen = session()
    db = next(gen)
    from app.modules.users.models import User

    user = db.get(User, UUID(data["user"]["id"]))
    assert user.is_active and user.email == "relay@privaterelay.appleid.com"
    assert db.scalar(select(AuthIdentity)).provider == "google"
    gen.close()


def test_api_lifespan_runs_revocation_retry_without_a_separate_worker(monkeypatch):
    from app.application import lifespan
    from app.modules.auth import apple_jobs

    called = threading.Event()
    monkeypatch.setattr(settings, "apple_private_key", SecretStr("test-only"))
    monkeypatch.setattr(settings, "apple_token_encryption_key", SecretStr("test-only"))
    monkeypatch.setattr(apple_jobs, "run_revocation_cycle", lambda: called.set())

    async def check():
        async with lifespan(app):
            assert await asyncio.to_thread(called.wait, 2)

    asyncio.run(check())
