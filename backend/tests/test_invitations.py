from datetime import UTC, datetime
from uuid import uuid4

from app.core.config import settings
from app.modules.invitations.service import _response
from fastapi.testclient import TestClient


def _sign_up(client: TestClient, email: str) -> dict:
    response = client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": email,
            "password": "correct-horse-battery-staple",
            "display_name": "Test User",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_invitation_preview_accept_and_revoke(auth_client: TestClient) -> None:
    owner = _sign_up(auth_client, "invite-owner@example.com")
    owner_headers = {"Authorization": f"Bearer {owner['access_token']}"}
    space = auth_client.post(
        "/api/v1/spaces",
        headers=owner_headers,
        json={"name": "Invite Space", "type": "friends"},
    ).json()

    created = auth_client.post(
        f"/api/v1/spaces/{space['id']}/invitations",
        headers=owner_headers,
        json={"expires_in_days": 7, "max_uses": 1},
    )
    assert created.status_code == 201
    invitation = created.json()
    token = invitation["invite_url"].rsplit("/", 1)[-1]

    preview = auth_client.get(f"/api/v1/invitations/token/{token}")
    assert preview.status_code == 200
    assert preview.json()["remaining_uses"] == 1

    guest = _sign_up(auth_client, "invite-guest@example.com")
    guest_headers = {"Authorization": f"Bearer {guest['access_token']}"}
    accepted = auth_client.post(
        f"/api/v1/invitations/token/{token}/accept", headers=guest_headers
    )
    assert accepted.status_code == 200
    assert accepted.json()["remaining_uses"] == 0

    members = auth_client.get(
        f"/api/v1/spaces/{space['id']}/members", headers=guest_headers
    )
    assert members.status_code == 200
    assert len(members.json()["data"]) == 2

    reused = auth_client.post(
        f"/api/v1/invitations/token/{token}/accept", headers=owner_headers
    )
    assert reused.status_code == 410

    second = auth_client.post(
        f"/api/v1/spaces/{space['id']}/invitations",
        headers=owner_headers,
        json={"expires_in_days": 7},
    ).json()
    revoked = auth_client.delete(
        f"/api/v1/invitations/{second['id']}", headers=owner_headers
    )
    assert revoked.status_code == 204


def test_production_invitation_uses_the_mobile_deep_link(
    monkeypatch,
) -> None:
    invitation = type("InvitationStub", (), {
        "id": uuid4(),
        "space_id": uuid4(),
        "expires_at": datetime(2026, 8, 8, tzinfo=UTC),
        "max_uses": 1,
        "use_count": 0,
        "revoked_at": None,
    })()
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setattr(settings, "mobile_scheme", "wedo")

    response = _response(invitation, "invite-token")

    assert response.invite_url == "wedo://invite/invite-token"
