from fastapi.testclient import TestClient


def test_legal_pages_accessible(auth_client: TestClient) -> None:
    for path in [
        "/legal",
        "/legal/privacy",
        "/legal/terms",
        "/legal/delete-account",
        "/legal/account-deletion",
    ]:
        resp = auth_client.get(path)
        assert resp.status_code == 200
        assert "text/html" in resp.headers["content-type"]
        assert "WeDo" in resp.text
        assert "Gizlilik Politikası" in resp.text


def test_legal_redirects(auth_client: TestClient) -> None:
    redirects = {
        "/privacy": "/legal?lang=tr#privacy",
        "/terms": "/legal?lang=tr#terms",
        "/delete-account": "/legal?lang=tr#delete-account",
    }
    for path, target in redirects.items():
        resp = auth_client.get(path, follow_redirects=False)
        assert resp.status_code == 302
        assert resp.headers["location"] == target
