from fastapi.testclient import TestClient

from tests.helpers import verified_sign_up


def test_item_comments_update_and_activity_timeline(auth_client: TestClient) -> None:
    sign_up = verified_sign_up(
        auth_client,
        "/api/v1/auth/sign-up",
        json={
            "email": "collab-owner@example.com",
            "password": "Correct-horse-battery-staple1",
            "display_name": "Liste Sahibi",
        },
    )
    assert sign_up.status_code == 201
    auth = auth_client.post(
        "/api/v1/auth/sign-in",
        json={
            "email": "collab-owner@example.com",
            "password": "Correct-horse-battery-staple1",
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
    # Reactions remain intentionally unmounted.
    reaction = auth_client.put(f"/api/v1/items/{item['id']}/reaction", headers=headers)
    assert reaction.status_code == 404

    updated_item = auth_client.patch(
        f"/api/v1/items/{item['id']}",
        headers=headers,
        json={"title": "Güncel Başlık", "description": "İlk not"},
    )
    assert updated_item.status_code == 200
    assert updated_item.json()["description"] == "İlk not"

    cleared_desc = auth_client.patch(
        f"/api/v1/items/{item['id']}",
        headers=headers,
        json={"title": "Güncel Başlık", "description": ""},
    )
    assert cleared_desc.status_code == 200
    assert cleared_desc.json()["description"] is None

    created_comment = auth_client.post(
        f"/api/v1/items/{item['id']}/comments",
        headers=headers,
        json={"body": "Harika fikir"},
    )
    assert created_comment.status_code == 201
    comment_id = created_comment.json()["id"]

    edited_comment = auth_client.patch(
        f"/api/v1/comments/{comment_id}",
        headers=headers,
        json={"body": "Cumartesi gidelim"},
    )
    assert edited_comment.status_code == 200
    assert edited_comment.json()["body"] == "Cumartesi gidelim"

    listed_comments = auth_client.get(
        f"/api/v1/items/{item['id']}/comments", headers=headers
    )
    assert listed_comments.status_code == 200
    assert listed_comments.json()["data"][0]["body"] == "Cumartesi gidelim"

    activity = auth_client.get(f"/api/v1/items/{item['id']}/activity", headers=headers)
    assert activity.status_code == 200
    types = {entry["type"] for entry in activity.json()["data"]}
    assert {"item_created", "item_updated", "comment_created"}.issubset(types)

    deleted_comment = auth_client.delete(
        f"/api/v1/comments/{comment_id}", headers=headers
    )
    assert deleted_comment.status_code == 204
