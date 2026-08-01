from fastapi.testclient import TestClient


def test_memory_and_upload_lifecycle(auth_client: TestClient) -> None:
    sign_up = auth_client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": "memories@example.com",
            "password": "Correct-horse-battery-staple1",
            "display_name": "Memories User",
        },
    )
    assert sign_up.status_code == 201
    auth = auth_client.post(
        "/api/v1/auth/sign-in",
        json={
            "email": "memories@example.com",
            "password": "Correct-horse-battery-staple1",
        },
    ).json()
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    space = auth_client.post(
        "/api/v1/spaces",
        headers=headers,
        json={"name": "Memory Space", "type": "personal"},
    ).json()
    list_item = auth_client.post(
        f"/api/v1/spaces/{space['id']}/lists",
        headers=headers,
        json={"name": "Done"},
    ).json()
    item = auth_client.post(
        "/api/v1/items",
        headers=headers,
        json={
            "space_id": space["id"],
            "list_id": list_item["id"],
            "original_url": "https://example.com/memory",
        },
    ).json()

    memory = auth_client.post(
        f"/api/v1/items/{item['id']}/memories",
        headers=headers,
        json={"note": "Çok güzeldi", "rating": 5},
    )
    assert memory.status_code == 201
    memory_id = memory.json()["id"]
    assert (
        auth_client.get(
            f"/api/v1/spaces/{space['id']}/memories", headers=headers
        ).status_code
        == 200
    )
    assert (
        auth_client.patch(
            f"/api/v1/memories/{memory_id}",
            headers=headers,
            json={"note": "Harikaydı", "rating": 5},
        ).status_code
        == 200
    )

    presign = auth_client.post(
        "/api/v1/uploads/presign",
        headers=headers,
        json={
            "filename": "memory.jpg",
            "content_type": "image/jpeg",
            "size_bytes": 1024,
        },
    )
    assert presign.status_code == 201
    upload_id = presign.json()["upload_id"]
    completed = auth_client.post(
        f"/api/v1/uploads/{upload_id}/complete", headers=headers
    )
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"
