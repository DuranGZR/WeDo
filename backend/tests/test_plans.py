from fastapi.testclient import TestClient


def test_plan_api_is_removed(auth_client: TestClient) -> None:
    response = auth_client.post("/api/v1/plans", json={})
    assert response.status_code == 404
