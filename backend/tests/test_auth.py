from fastapi.testclient import TestClient


def test_auth_lifecycle(auth_client: TestClient) -> None:
    sign_up = auth_client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": "ipek@example.com",
            "password": "Correct-horse-battery-staple1",
            "display_name": "İpek",
            "device_id": "iphone-1",
        },
    )
    assert sign_up.status_code == 201
    assert sign_up.json()["email"] == "ipek@example.com"

    sign_in = auth_client.post(
        "/api/v1/auth/sign-in",
        json={
            "email": "IPEK@EXAMPLE.COM",
            "password": "Correct-horse-battery-staple1",
            "device_id": "iphone-1",
        },
    )
    assert sign_in.status_code == 200
    tokens = sign_in.json()

    me = auth_client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["display_name"] == "İpek"

    refreshed = auth_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert refreshed.status_code == 200
    refreshed_tokens = refreshed.json()
    assert refreshed_tokens["refresh_token"] != tokens["refresh_token"]

    old_refresh = auth_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert old_refresh.status_code == 401

    sign_out = auth_client.post(
        "/api/v1/auth/sign-out",
        json={"refresh_token": refreshed_tokens["refresh_token"]},
    )
    assert sign_out.status_code == 204


def test_duplicate_email_is_rejected(auth_client: TestClient) -> None:
    payload = {
        "email": "can@example.com",
        "password": "Correct-horse-battery-staple1",
        "display_name": "Can",
    }
    assert auth_client.post("/api/v1/auth/sign-up", json=payload).status_code == 201
    duplicate = auth_client.post("/api/v1/auth/sign-up", json=payload)

    assert duplicate.status_code == 409


def test_sign_up_rejects_password_without_all_required_character_types(
    auth_client: TestClient,
) -> None:
    response = auth_client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": "weak-password@example.com",
            "password": "onlylowercase1",
            "display_name": "Weak Password",
        },
    )

    assert response.status_code == 422
