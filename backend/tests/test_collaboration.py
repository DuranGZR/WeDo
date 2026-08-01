from fastapi.testclient import TestClient


def test_item_exposes_creator_and_collaboration_actions_are_removed(
    auth_client: TestClient,
) -> None:
    auth = auth_client.post(
        "/api/v1/auth/sign-up",
        json={
            "email": "collab-owner@example.com",
            "password": "correct-horse-battery-staple",
            "display_name": "Liste Sahibi",
        },
    ).json()
    headers = {"Authorization": f"Bearer {auth['access_token']}"}
    space = auth_client.post(
        "/api/v1/spaces",
        headers=headers,
        json={"name": "Ortak Alan", "type": "personal"},
    ).json()
    shared_list = auth_client.post(
        f"/api/v1/spaces/{space['id']}/lists", headers=headers, json={"name": "Liste"}
    ).json()
    item = auth_client.post(
        "/api/v1/items",
        headers=headers,
        json={
            "space_id": space["id"],
            "list_id": shared_list["id"],
            "original_url": "https://example.com/item",
        },
    ).json()

    assert item["created_by_name"] == "Liste Sahibi"
    reaction = auth_client.put(f"/api/v1/items/{item['id']}/reaction", headers=headers)
    comments = auth_client.get(f"/api/v1/items/{item['id']}/comments", headers=headers)
    plans = auth_client.post("/api/v1/plans", headers=headers, json={})

    assert reaction.status_code == 404
    assert comments.status_code == 404
    assert plans.status_code == 404
