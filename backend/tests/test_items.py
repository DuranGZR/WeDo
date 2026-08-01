from fastapi.testclient import TestClient


def test_share_item_lifecycle(auth_client: TestClient) -> None:
    auth = auth_client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": "items@example.com",
            "password": "correct-horse-battery-staple",
            "display_name": "Items User",
        },
    ).json()
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    space = auth_client.post(
        "/api/v1/spaces",
        headers=headers,
        json={"name": "Item Space", "type": "couple"},
    ).json()
    list_item = auth_client.post(
        f"/api/v1/spaces/{space['id']}/lists",
        headers=headers,
        json={"name": "Gidilecek Yerler"},
    ).json()

    created = auth_client.post(
        "/api/v1/items",
        headers=headers,
        json={
            "space_id": space["id"],
            "list_id": list_item["id"],
            "original_url": "https://Example.com/place/1?utm_source=instagram&ref=keep",
            "shared_text": "Buraya gidelim",
            "client_item_id": "mobile-item-1",
            "source_app": "com.instagram.android",
        },
    )
    assert created.status_code == 201
    item = created.json()
    assert item["source_domain"] == "example.com"
    assert item["metadata_status"] == "pending"

    duplicate_client = auth_client.post(
        "/api/v1/items",
        headers=headers,
        json={
            "space_id": space["id"],
            "list_id": list_item["id"],
            "original_url": "https://example.com/other",
            "client_item_id": "mobile-item-1",
        },
    )
    assert duplicate_client.status_code == 409

    duplicate_url = auth_client.post(
        "/api/v1/items",
        headers=headers,
        json={
            "space_id": space["id"],
            "list_id": list_item["id"],
            "original_url": "https://example.com/place/1?ref=keep&utm_medium=social",
        },
    )
    assert duplicate_url.status_code == 409

    completed = auth_client.post(
        f"/api/v1/items/{item['id']}/complete", headers=headers
    )
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"

    restored = auth_client.post(f"/api/v1/items/{item['id']}/restore", headers=headers)
    assert restored.status_code == 200
    assert restored.json()["status"] == "new"

    items = auth_client.get(f"/api/v1/lists/{list_item['id']}/items", headers=headers)
    assert items.status_code == 200
    assert len(items.json()["data"]) == 1
