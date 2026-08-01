from fastapi.testclient import TestClient


def _sign_up(client: TestClient, email: str) -> dict:
    response = client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": email,
            "password": "Correct-horse-battery-staple1",
            "display_name": "Test User",
        },
    )
    assert response.status_code == 201
    sign_in = client.post(
        "/api/v1/auth/sign-in",
        json={"email": email, "password": "Correct-horse-battery-staple1"},
    )
    assert sign_in.status_code == 200
    return sign_in.json()


def test_space_lifecycle_and_permissions(auth_client: TestClient) -> None:
    tokens = _sign_up(auth_client, "owner@example.com")
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    created = auth_client.post(
        "/api/v1/spaces",
        headers=headers,
        json={"name": "İpek & Can", "type": "couple"},
    )
    assert created.status_code == 201
    space = created.json()
    assert space["name"] == "İpek & Can"
    assert space["member_count"] == 1

    listed = auth_client.get("/api/v1/spaces", headers=headers)
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()["data"]] == [space["id"]]

    members = auth_client.get(f"/api/v1/spaces/{space['id']}/members", headers=headers)
    assert members.status_code == 200
    assert members.json()["data"][0]["role"] == "owner"

    updated = auth_client.patch(
        f"/api/v1/spaces/{space['id']}",
        headers=headers,
        json={"name": "Yeni Alan", "type": "friends"},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Yeni Alan"
    assert updated.json()["type"] == "friends"


def test_space_requires_membership(auth_client: TestClient) -> None:
    owner_tokens = _sign_up(auth_client, "owner2@example.com")
    owner_headers = {"Authorization": f"Bearer {owner_tokens['access_token']}"}
    created = auth_client.post(
        "/api/v1/spaces",
        headers=owner_headers,
        json={"name": "Private Space", "type": "personal"},
    )
    space_id = created.json()["id"]

    other_tokens = _sign_up(auth_client, "other@example.com")
    other_headers = {"Authorization": f"Bearer {other_tokens['access_token']}"}
    response = auth_client.get(f"/api/v1/spaces/{space_id}", headers=other_headers)

    assert response.status_code == 403
