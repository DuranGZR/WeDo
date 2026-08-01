from curl_cffi import requests

from app.modules.metadata.exceptions import MetadataError
from app.modules.metadata.security import validate_url


class MetadataFetcher:
    def __init__(self) -> None:
        self.session = requests.Session()

    def close(self) -> None:
        self.session.close()

    def _request(self, url: str):
        validate_url(url)
        response = self.session.get(
            url,
            impersonate="chrome",
            timeout=5.0,
            allow_redirects=True,
        )
        for redirect in response.history:
            validate_url(redirect.url)
        validate_url(response.url)

        if len(response.content) > 2 * 1024 * 1024:
            raise MetadataError("Sayfa boyutu izin verilen limiti aşıyor.")
        if response.status_code >= 400:
            raise MetadataError(f"HTTP hata kodu: {response.status_code}")
        return response

    def fetch(self, url: str):
        try:
            return self._request(url)
        except Exception as error:
            raise MetadataError("Metadata alınamadı.") from error

    def fetch_json(self, url: str) -> dict[str, object]:
        try:
            payload = self._request(url).json()
            if not isinstance(payload, dict):
                raise ValueError("JSON nesnesi bekleniyordu.")
            return payload
        except Exception as error:
            raise MetadataError("Sağlayıcı metadatası alınamadı.") from error
