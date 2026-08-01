from fastapi.testclient import TestClient


def _signup(client: TestClient, email: str) -> dict:
    response = client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": email,
            "password": "Correct-horse-battery-staple1",
            "display_name": "Regression User",
        },
    )
    assert response.status_code == 201
    sign_in = client.post(
        "/api/v1/auth/sign-in",
        json={"email": email, "password": "Correct-horse-battery-staple1"},
    )
    assert sign_in.status_code == 200
    return sign_in.json()


def test_admin_cannot_promote_member_to_owner(auth_client: TestClient) -> None:
    owner = _signup(auth_client, "security-owner@example.com")
    owner_headers = {"Authorization": f"Bearer {owner['access_token']}"}
    space = auth_client.post(
        "/api/v1/spaces",
        headers=owner_headers,
        json={"name": "Security Space", "type": "group"},
    ).json()
    invite = auth_client.post(
        f"/api/v1/spaces/{space['id']}/invitations",
        headers=owner_headers,
        json={},
    ).json()
    guest = _signup(auth_client, "security-guest@example.com")
    guest_headers = {"Authorization": f"Bearer {guest['access_token']}"}
    auth_client.post(
        f"/api/v1/invitations/token/{invite['invite_url'].rsplit('/', 1)[-1]}/accept",
        headers=guest_headers,
    )
    members = auth_client.get(
        f"/api/v1/spaces/{space['id']}/members", headers=owner_headers
    ).json()["data"]
    guest_member = next(
        member for member in members if member["user_id"] == guest["user"]["id"]
    )

    response = auth_client.patch(
        f"/api/v1/spaces/{space['id']}/members/{guest_member['id']}",
        headers=owner_headers,
        json={"role": "owner"},
    )
    assert response.status_code == 400


def test_deleted_space_is_not_accessible(auth_client: TestClient) -> None:
    auth = _signup(auth_client, "deleted-space@example.com")
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    space = auth_client.post(
        "/api/v1/spaces",
        headers=headers,
        json={"name": "Deleted Space", "type": "personal"},
    ).json()
    assert (
        auth_client.delete(f"/api/v1/spaces/{space['id']}", headers=headers).status_code
        == 204
    )
    assert (
        auth_client.get(f"/api/v1/spaces/{space['id']}", headers=headers).status_code
        == 404
    )


def test_sign_out_all_revokes_access_token(auth_client: TestClient) -> None:
    auth = _signup(auth_client, "signout-all@example.com")
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    assert (
        auth_client.post("/api/v1/auth/sign-out-all", headers=headers).status_code
        == 204
    )
    assert auth_client.get("/api/v1/users/me", headers=headers).status_code == 401


def test_item_creation_creates_member_notification(auth_client: TestClient) -> None:
    owner = _signup(auth_client, "notification-owner@example.com")
    owner_headers = {"Authorization": f"Bearer {owner['access_token']}"}
    space = auth_client.post(
        "/api/v1/spaces",
        headers=owner_headers,
        json={"name": "Notification Space", "type": "couple"},
    ).json()
    invite = auth_client.post(
        f"/api/v1/spaces/{space['id']}/invitations",
        headers=owner_headers,
        json={},
    ).json()
    guest = _signup(auth_client, "notification-guest@example.com")
    guest_headers = {"Authorization": f"Bearer {guest['access_token']}"}
    auth_client.post(
        f"/api/v1/invitations/token/{invite['invite_url'].rsplit('/', 1)[-1]}/accept",
        headers=guest_headers,
    )
    list_item = auth_client.post(
        f"/api/v1/spaces/{space['id']}/lists",
        headers=owner_headers,
        json={"name": "Shared"},
    ).json()
    auth_client.post(
        "/api/v1/items",
        headers=owner_headers,
        json={
            "space_id": space["id"],
            "list_id": list_item["id"],
            "original_url": "https://example.com/notification",
        },
    )
    assert auth_client.get(
        "/api/v1/notifications/unread-count", headers=guest_headers
    ).json() == {"count": 1}


def test_user_avatar_url_endpoint_is_not_exposed(auth_client: TestClient) -> None:
    auth = _signup(auth_client, "avatar-contract@example.com")
    response = auth_client.post(
        "/api/v1/users/me/avatar",
        headers={"Authorization": f"Bearer {auth['access_token']}"},
        json={"avatar_url": "https://cdn.example.com/avatar.png"},
    )
    assert response.status_code == 404


def test_password_change_revokes_all_sessions(auth_client: TestClient) -> None:
    auth = _signup(auth_client, "password-change@example.com")
    headers = {"Authorization": f"Bearer {auth['access_token']}"}

    response = auth_client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={
            "current_password": "Correct-horse-battery-staple1",
            "new_password": "New-secure-password-2026",
        },
    )

    assert response.status_code == 204
    assert auth_client.get("/api/v1/users/me", headers=headers).status_code == 401
    assert (
        auth_client.post(
            "/api/v1/auth/sign-in",
            json={
                "email": "password-change@example.com",
                "password": "New-secure-password-2026",
            },
        ).status_code
        == 200
    )


def test_account_deletion_requires_current_password(auth_client: TestClient) -> None:
    auth = _signup(auth_client, "delete-account@example.com")
    headers = {"Authorization": f"Bearer {auth['access_token']}"}

    denied = auth_client.request(
        "DELETE",
        "/api/v1/users/me",
        headers=headers,
        json={"current_password": "wrong-password"},
    )
    assert denied.status_code == 401

    deleted = auth_client.request(
        "DELETE",
        "/api/v1/users/me",
        headers=headers,
        json={"current_password": "Correct-horse-battery-staple1"},
    )
    assert deleted.status_code == 204
    assert auth_client.get("/api/v1/users/me", headers=headers).status_code == 401


def test_device_endpoint_updates_registered_device(auth_client: TestClient) -> None:
    auth = _signup(auth_client, "device-contract@example.com")
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    device = {
        "device_id": "device-contract-1",
        "platform": "ios",
        "push_token": "ExponentPushToken[old]",
    }
    assert (
        auth_client.post("/api/v1/devices", headers=headers, json=device).status_code
        == 201
    )
    device["push_token"] = "ExponentPushToken[new]"
    response = auth_client.patch(
        "/api/v1/devices/device-contract-1", headers=headers, json=device
    )
    assert response.status_code == 200
    assert response.json()["push_token"] == "ExponentPushToken[new]"


def test_item_activity_endpoint_returns_item_events(auth_client: TestClient) -> None:
    auth = _signup(auth_client, "activity-removed@example.com")
    response = auth_client.get(
        "/api/v1/items/00000000-0000-0000-0000-000000000000/activity",
        headers={"Authorization": f"Bearer {auth['access_token']}"},
    )
    assert response.status_code == 404


def test_upload_completion_contract_accepts_upload_id_body(
    auth_client: TestClient,
) -> None:
    auth = _signup(auth_client, "upload-contract@example.com")
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    presigned = auth_client.post(
        "/api/v1/uploads/presign",
        headers=headers,
        json={
            "filename": "photo.png",
            "content_type": "image/png",
            "size_bytes": 1024,
        },
    )
    assert presigned.status_code == 201
    upload_id = presigned.json()["upload_id"]
    response = auth_client.post(
        "/api/v1/uploads/complete",
        headers=headers,
        json={"upload_id": upload_id},
    )
    assert response.status_code == 200
    assert response.json()["id"] == upload_id


def test_errors_include_common_request_id_envelope(auth_client: TestClient) -> None:
    response = auth_client.get(
        "/api/v1/users/me", headers={"X-Request-ID": "contract-request-1"}
    )
    assert response.status_code == 401
    assert response.headers["X-Request-ID"] == "contract-request-1"
    assert response.json()["error"]["code"] == "HTTP_401"
    assert response.json()["error"]["request_id"] == "contract-request-1"
