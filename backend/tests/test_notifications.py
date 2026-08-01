from fastapi.testclient import TestClient


def test_device_registration_and_notification_endpoints(
    auth_client: TestClient,
) -> None:
    auth = auth_client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": "notifications@example.com",
            "password": "correct-horse-battery-staple",
            "display_name": "Notifications User",
        },
    ).json()
    headers = {"Authorization": f"Bearer {auth['access_token']}"}

    device = auth_client.post(
        "/api/v1/devices",
        headers=headers,
        json={
            "device_id": "pixel-1",
            "platform": "android",
            "push_token": "ExponentPushToken[test]",
        },
    )
    assert device.status_code == 201
    assert device.json()["platform"] == "android"

    unread = auth_client.get("/api/v1/notifications/unread-count", headers=headers)
    assert unread.status_code == 200
    assert unread.json() == {"count": 0}

    disabled = auth_client.delete("/api/v1/devices/pixel-1", headers=headers)
    assert disabled.status_code == 204
