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


def test_delete_account_anonymizes_data_and_revokes_access(
    auth_client: TestClient,
) -> None:
    sign_up = auth_client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": "to-delete@example.com",
            "password": "Correct-horse-battery-staple1",
            "display_name": "Delete Me",
        },
    )
    assert sign_up.status_code == 201

    sign_in = auth_client.post(
        "/api/v1/auth/sign-in",
        json={
            "email": "to-delete@example.com",
            "password": "Correct-horse-battery-staple1",
        },
    )
    assert sign_in.status_code == 200
    token = sign_in.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    delete_resp = auth_client.request(
        "DELETE",
        "/api/v1/users/me",
        headers=headers,
        json={"current_password": "Correct-horse-battery-staple1"},
    )
    assert delete_resp.status_code == 204

    # Access is revoked
    me = auth_client.get("/api/v1/users/me", headers=headers)
    assert me.status_code == 401

    # Original email is freed up for re-registration
    new_sign_up = auth_client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": "to-delete@example.com",
            "password": "Correct-horse-battery-staple1",
            "display_name": "New Fresh User",
        },
    )
    assert new_sign_up.status_code == 201


def test_apple_sign_in_creates_new_user_and_allows_passwordless_delete(
    auth_client: TestClient,
) -> None:
    import jwt

    apple_user_id = "000123.apple.unique.id"
    dummy_token = jwt.encode(
        {
            "iss": "https://appleid.apple.com",
            "sub": apple_user_id,
            "aud": "com.wedo.app",
            "email": "appleuser@example.com",
        },
        key="development-only-test-key-32chars!",
        algorithm="HS256",
    )

    resp = auth_client.post(
        "/api/v1/auth/apple",
        json={
            "identity_token": dummy_token,
            "apple_user_id": apple_user_id,
            "email": "appleuser@example.com",
            "display_name": "Apple User",
            "device_id": "ios-device-1",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "appleuser@example.com"
    assert data["user"]["display_name"] == "Apple User"
    assert data["user"]["has_password"] is False

    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me_resp = auth_client.get("/api/v1/users/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["has_password"] is False

    second_resp = auth_client.post(
        "/api/v1/auth/apple",
        json={
            "identity_token": dummy_token,
            "apple_user_id": apple_user_id,
        },
    )
    assert second_resp.status_code == 200
    assert second_resp.json()["user"]["email"] == "appleuser@example.com"

    delete_resp = auth_client.request(
        "DELETE",
        "/api/v1/users/me",
        headers=headers,
        json={},
    )
    assert delete_resp.status_code == 204

    revoked_me = auth_client.get("/api/v1/users/me", headers=headers)
    assert revoked_me.status_code == 401


def test_google_sign_in_creates_new_user_and_authenticates(
    auth_client: TestClient,
    google_token,
) -> None:
    resp = auth_client.post(
        "/api/v1/auth/google",
        json={
            "id_token": google_token(),
            "google_user_id": "forged-user",
            "email": "victim@example.com",
            "display_name": "Forged Name",
            "device_id": "iphone-1",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "googleuser@gmail.com"
    assert data["user"]["display_name"] == "Google User"
    assert data["user"]["has_password"] is False

    repeated = auth_client.post(
        "/api/v1/auth/google", json={"id_token": google_token()}
    )
    assert repeated.status_code == 200
    assert repeated.json()["user"]["id"] == data["user"]["id"]
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    assert auth_client.get("/api/v1/users/me", headers=headers).status_code == 200
    assert auth_client.post(
        "/api/v1/auth/refresh", json={"refresh_token": data["refresh_token"]}
    ).status_code == 200


