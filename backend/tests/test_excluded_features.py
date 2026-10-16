import pytest


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("get", "/api/v1/spaces/00000000-0000-0000-0000-000000000001/memories"),
        ("post", "/api/v1/items/00000000-0000-0000-0000-000000000001/memories"),
        ("get", "/api/v1/memories/00000000-0000-0000-0000-000000000001"),
        ("post", "/api/v1/uploads/presign"),
        ("post", "/api/v1/uploads/complete"),
    ],
)
def test_memory_and_gallery_upload_apis_are_not_exposed(auth_client, method, path):
    assert auth_client.request(method, path).status_code == 404
