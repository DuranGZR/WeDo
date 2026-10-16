import re
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from unittest.mock import Mock

import pytest
from app.api.dependencies import get_session
from app.core.localization import CATALOGS, language_context, message, resolve_language
from app.main import app
from app.modules.auth.models import EmailVerification
from app.modules.items.schemas import ItemResponse
from app.modules.notifications import service as notifications
from app.modules.notifications.models import DevicePushToken
from app.modules.notifications.schemas import DeviceTokenCreate
from app.modules.users.models import User
from sqlalchemy import select


@pytest.fixture
def db(auth_client):
    generator = app.dependency_overrides[get_session]()
    try:
        yield next(generator)
    finally:
        generator.close()


def register(client, language="en"):
    payload = {
        "email": "locale@example.com",
        "password": "A-correct-password123",
        "display_name": "İstanbul Kullanıcısı",
    }
    response = client.post(
        "/api/v1/auth/sign-up", json=payload, headers={"Accept-Language": language}
    )
    assert response.status_code == 201
    code = re.search(r"\b\d{6}\b", client.verification_messages[-1]["text"])[0]
    assert (
        client.post(
            "/api/v1/auth/verify-email",
            json={
                "verification_id": response.json()["verification_id"],
                "code": code,
            },
        ).status_code
        == 204
    )
    token = client.post("/api/v1/auth/sign-in", json=payload).json()["access_token"]
    return {"Authorization": f"Bearer {token}", "Accept-Language": language}


@pytest.mark.parametrize(
    ("header", "expected"),
    [
        (None, "en"),
        ("de-DE", "en"),
        ("tr-CY,en;q=0.8", "tr"),
        ("tr;q=0.2,en-US;q=0.9", "en"),
        ("en;q=0,tr;q=0.5", "tr"),
        ("tr;q=bad,en", "en"),
        ("tr;q=2,en", "en"),
    ],
)
def test_language_resolution(header, expected):
    assert resolve_language(header) == expected


def test_catalog_keys_and_placeholders_match():
    assert CATALOGS["tr"].keys() == CATALOGS["en"].keys()
    for key, text in CATALOGS["tr"].items():
        assert text.strip() and CATALOGS["en"][key].strip(), key
        assert sorted(re.findall(r"{{(\w+)}}", text)) == sorted(
            re.findall(r"{{(\w+)}}", CATALOGS["en"][key])
        ), key


def test_response_defaults_are_resolved_per_request_not_at_import():
    field = ItemResponse.model_fields["created_by_name"]
    with language_context("en"):
        english = field.get_default(call_default_factory=True)
    with language_context("tr"):
        turkish = field.get_default(call_default_factory=True)
    assert english == "Unknown user"
    assert turkish != english


def test_errors_and_legal_pages_use_request_language_without_leaking(auth_client):
    def fetch(language):
        result = auth_client.get("/legal", headers={"Accept-Language": language})
        return result.headers["Content-Language"], result.text

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(fetch, ["en", "tr"] * 3))
    for index, (language, text) in enumerate(results):
        expected = "en" if index % 2 == 0 else "tr"
        assert language == expected
        assert f'lang="{expected}"' in text
        assert ("Privacy Policy" if expected == "en" else "Gizlilik Politikası") in text
        assert "{{web." not in text and "__FORM_" not in text
    english = auth_client.post(
        "/api/v1/auth/sign-in", headers={"Accept-Language": "en"}, json={"email": "x"}
    )
    turkish = auth_client.post(
        "/api/v1/auth/sign-in", headers={"Accept-Language": "tr"}, json={"email": "x"}
    )
    assert english.status_code == turkish.status_code == 422
    assert english.json()["error"]["message"] != turkish.json()["error"]["message"]
    assert english.json()["error"]["code"] == turkish.json()["error"]["code"]
    explicit = auth_client.get("/legal?lang=en", headers={"Accept-Language": "tr"})
    assert explicit.headers["Content-Language"] == "en"
    assert (
        auth_client.get("/privacy?lang=en", follow_redirects=False).headers["location"]
        == "/legal?lang=en#privacy"
    )


def test_profile_and_verification_email_preserve_account_language(auth_client, db):
    headers = register(auth_client)
    user = db.scalar(select(User))
    assert user.preferred_language == "en"
    assert (
        auth_client.verification_messages[-1]["subject"]
        == "Your WeDo email verification code"
    )
    profile = auth_client.get("/api/v1/users/me", headers=headers).json()
    assert profile["display_name"] == "İstanbul Kullanıcısı"
    assert profile["preferred_language"] == "en"
    auth_client.get("/api/v1/users/me", headers={**headers, "Accept-Language": "tr"})
    db.refresh(user)
    assert user.preferred_language == "en"
    changed = auth_client.patch(
        "/api/v1/users/me", headers=headers, json={"preferred_language": "tr"}
    )
    assert changed.status_code == 200 and changed.json()["preferred_language"] == "tr"
    invalid = auth_client.patch(
        "/api/v1/users/me", headers=headers, json={"preferred_language": "de"}
    )
    assert invalid.status_code == 422


def test_resend_uses_stored_language_even_when_request_language_differs(
    auth_client, db
):
    response = auth_client.post(
        "/api/v1/auth/sign-up",
        headers={"Accept-Language": "en"},
        json={
            "email": "resend@example.com",
            "password": "A-correct-password123",
            "display_name": "Owner",
        },
    )
    challenge = db.scalar(select(EmailVerification))
    challenge.sent_at = datetime.now(UTC) - timedelta(minutes=2)
    db.commit()
    result = auth_client.post(
        "/api/v1/auth/resend-verification",
        headers={"Accept-Language": "tr"},
        json={"verification_id": response.json()["verification_id"]},
    )
    assert result.status_code == 200
    assert (
        auth_client.verification_messages[-1]["subject"]
        == "Your WeDo email verification code"
    )


def test_notifications_render_per_device_and_leave_names_unchanged(
    auth_client, db, monkeypatch
):
    register(auth_client)
    user = db.scalar(select(User))
    for language in ("tr", "en"):
        notifications.register_device(
            db,
            user.id,
            DeviceTokenCreate(
                device_id=f"device-{language}",
                platform="ios",
                language=language,
                push_token=f"ExponentPushToken[{language}]",
            ),
        )
    with language_context("tr"):
        title = message("message.newComment")
        body = message("invite.metaDescription", name="Çağrı & London")
        row = notifications.create_notification(
            db,
            user_id=user.id,
            notification_type="comment_created",
            title=title,
            body=body,
        )
        db.commit()
    sender = Mock(return_value=True)
    monkeypatch.setattr(notifications, "send_expo_push", sender)
    assert notifications.dispatch_pending_pushes(db) == 1
    pushes = {p["to"]: p for p in sender.call_args.args[0]}
    assert pushes["ExponentPushToken[en]"]["title"] == "New comment"
    assert pushes["ExponentPushToken[tr]"]["title"] == "Yeni yorum"
    assert all("Çağrı & London" in item["body"] for item in pushes.values())
    with language_context("en"):
        assert notifications.list_notifications(db, user.id)[0].title == "New comment"
    row.title_key = None
    assert notifications.notification_text(row, "title", "tr") == "Yeni yorum"
    assert notifications.notification_text(row, "title", "en") == "New comment"
    row.type = "unknown_legacy_type"
    assert notifications.notification_text(row, "title", "en") == "New update"
    notifications.register_device(
        db,
        user.id,
        DeviceTokenCreate(
            device_id="device-tr",
            platform="ios",
            language="en",
            push_token="ExponentPushToken[tr]",
        ),
    )
    assert (
        db.scalar(
            select(DevicePushToken).where(DevicePushToken.device_id == "device-tr")
        ).language
        == "en"
    )


def test_invalid_invitation_page_is_translated(auth_client):
    page = auth_client.get("/invite/invalid?lang=en")
    assert 'lang="en"' in page.text and "Invitation not found" in page.text
    assert "Davet bulunamadı" not in page.text
    assert "https://apps.apple.com/app/wedo/id" not in page.text


def test_invitation_translates_copy_and_escapes_shared_names(auth_client):
    headers = register(auth_client)
    name = 'Plan <script>alert("test")</script>'
    space = auth_client.post(
        "/api/v1/spaces", headers=headers, json={"name": name, "type": "couple"}
    ).json()
    invitation = auth_client.post(
        f"/api/v1/spaces/{space['id']}/invitations",
        headers=headers,
        json={"expires_in_days": 7},
    ).json()
    page = auth_client.get(f"/invite/{invitation['token']}?lang=en")
    assert page.status_code == 200
    assert "Shared space invitation" in page.text
    assert "&lt;script&gt;" in page.text
    assert name not in page.text
    assert (
        auth_client.get(f"/api/v1/spaces/{space['id']}", headers=headers).json()["name"]
        == name
    )


def test_deletion_form_returns_localized_acknowledgement(auth_client, monkeypatch):
    from app.modules.legal import service

    sender = Mock()
    monkeypatch.setattr(service, "send_email", sender)
    response = auth_client.post(
        "/legal/deletion-requests",
        headers={"Accept-Language": "en"},
        json={"email": "request@example.com", "reason": "Türkçe kullanıcı notu"},
    )
    assert response.status_code == 202
    assert response.json()["message"].startswith("Your request has been sent")
    assert sender.call_args.kwargs["subject"] == "WeDo account deletion request"
    assert "Türkçe kullanıcı notu" in sender.call_args.kwargs["text"]
