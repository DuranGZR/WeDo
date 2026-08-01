from fastapi.testclient import TestClient


def test_list_lifecycle(auth_client: TestClient) -> None:
    sign_up = auth_client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": "lists@example.com",
            "password": "Correct-horse-battery-staple1",
            "display_name": "Lists User",
        },
    )
    assert sign_up.status_code == 201
    auth = auth_client.post(
        "/api/v1/auth/sign-in",
        json={
            "email": "lists@example.com",
            "password": "Correct-horse-battery-staple1",
        },
    ).json()
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    space = auth_client.post(
        "/api/v1/spaces",
        headers=headers,
        json={"name": "List Space", "type": "personal"},
    ).json()

    created = auth_client.post(
        f"/api/v1/spaces/{space['id']}/lists",
        headers=headers,
        json={"name": "Gidilecek Yerler", "position": 100},
    )
    assert created.status_code == 201
    list_item = created.json()

    duplicate = auth_client.post(
        f"/api/v1/spaces/{space['id']}/lists",
        headers=headers,
        json={"name": "  gidilecek   yerler  "},
    )
    assert duplicate.status_code == 409

    updated = auth_client.patch(
        f"/api/v1/lists/{list_item['id']}",
        headers=headers,
        json={"name": "İzlenecekler", "position": 200},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "İzlenecekler"

    listed = auth_client.get(f"/api/v1/spaces/{space['id']}/lists", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()["data"]) == 1

    deleted = auth_client.delete(f"/api/v1/lists/{list_item['id']}", headers=headers)
    assert deleted.status_code == 204
    assert auth_client.get(
        f"/api/v1/spaces/{space['id']}/lists", headers=headers
    ).json() == {
        "data": [],
        "pagination": {"page": 1, "page_size": 20, "has_more": False},
    }
