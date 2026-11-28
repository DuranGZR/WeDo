from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient

from tests.helpers import verified_sign_up


def _create_verified_user(client: TestClient, email: str, name: str) -> dict[str, str]:
    sign_up = verified_sign_up(
        client,
        "/api/v1/auth/sign-up",
        json={
            "email": email,
            "password": "Correct-horse-battery-staple1",
            "display_name": name,
        },
    )
    assert sign_up.status_code == 201
    token = client.post(
        "/api/v1/auth/sign-in",
        json={
            "email": email,
            "password": "Correct-horse-battery-staple1",
        },
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_plan_lifecycle_reminder_notifications_and_status(
    auth_client: TestClient,
) -> None:
    owner_headers = _create_verified_user(auth_client, "plan-owner@example.com", "İpek")
    partner_headers = _create_verified_user(
        auth_client, "plan-partner@example.com", "Can"
    )

    space = auth_client.post(
        "/api/v1/spaces",
        headers=owner_headers,
        json={"name": "Plan Alanı", "type": "couple"},
    ).json()
    invite = auth_client.post(
        f"/api/v1/spaces/{space['id']}/invitations",
        headers=owner_headers,
        json={"max_uses": 1},
    ).json()
    joined = auth_client.post(
        f"/api/v1/invitations/token/{invite['token']}/accept",
        headers=partner_headers,
    )
    assert joined.status_code == 200

    shared_list = auth_client.post(
        f"/api/v1/spaces/{space['id']}/lists",
        headers=owner_headers,
        json={"name": "Mekanlar", "icon": "map-outline|#FAF5EE"},
    ).json()
    assert shared_list["icon"] == "map-outline|#FAF5EE"

    item = auth_client.post(
        "/api/v1/items",
        headers=owner_headers,
        json={
            "space_id": space["id"],
            "list_id": shared_list["id"],
            "original_url": "https://example.com/moda-kahve",
            "title": "Moda Kahvecisi",
        },
    ).json()

    scheduled = (datetime.now(UTC) + timedelta(days=1)).isoformat()
    created_plan = auth_client.post(
        "/api/v1/plans",
        headers=owner_headers,
        json={
            "space_id": space["id"],
            "item_id": item["id"],
            "scheduled_at": scheduled,
            "timezone": "Europe/Istanbul",
            "note": "📍 Moda\nPencere kenarı",
            "reminder_minutes_before": 60,
        },
    )
    assert created_plan.status_code == 201
    plan = created_plan.json()
    assert plan["status"] == "approved"
    assert plan["reminder_minutes_before"] == 60
    assert plan["created_by"]

    listed = auth_client.get(
        f"/api/v1/spaces/{space['id']}/plans", headers=partner_headers
    )
    assert listed.status_code == 200
    assert listed.json()["data"][0]["reminder_minutes_before"] == 60

    partner_notifs = auth_client.get("/api/v1/notifications", headers=partner_headers)
    assert partner_notifs.status_code == 200
    assert any(n["type"] == "plan_scheduled" for n in partner_notifs.json()["data"])

    cancelled = auth_client.post(
        f"/api/v1/plans/{plan['id']}/cancel", headers=partner_headers
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"
    refetched_item = auth_client.get(
        f"/api/v1/items/{item['id']}", headers=owner_headers
    )
    assert refetched_item.json()["status"] == "new"

    second_plan = auth_client.post(
        "/api/v1/plans",
        headers=owner_headers,
        json={
            "space_id": space["id"],
            "item_id": item["id"],
            "scheduled_at": scheduled,
            "reminder_minutes_before": 15,
        },
    ).json()
    assert second_plan["status"] == "approved"
    rescheduled = (datetime.now(UTC) + timedelta(days=2)).isoformat()
    updated_plan = auth_client.patch(
        f"/api/v1/plans/{second_plan['id']}",
        headers=partner_headers,
        json={
            "scheduled_at": rescheduled,
            "timezone": "Europe/Istanbul",
            "reminder_minutes_before": 1440,
        },
    )
    assert updated_plan.status_code == 200
    assert updated_plan.json()["reminder_minutes_before"] == 1440

    completed = auth_client.post(
        f"/api/v1/plans/{second_plan['id']}/complete", headers=partner_headers
    )
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"
    assert (
        auth_client.get(f"/api/v1/items/{item['id']}", headers=owner_headers).json()[
            "status"
        ]
        == "completed"
    )
