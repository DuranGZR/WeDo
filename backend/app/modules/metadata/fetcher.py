from urllib.parse import urljoin

from curl_cffi import CurlOpt, requests

from app.core.localization import message
from app.modules.metadata.exceptions import MetadataError
from app.modules.metadata.security import validate_and_resolve_url


class MetadataFetcher:
    def __init__(self) -> None:
        self.session = requests.Session()

    def close(self) -> None:
        self.session.close()

    def _request(self, url: str):
        current_url = url
        max_redirects = 5

        for _ in range(max_redirects):
            hostname, port, validated_ip = validate_and_resolve_url(current_url)
            # Pin the hostname:port to the validated public IP to prevent DNS rebinding
            if hasattr(self.session, "curl") and self.session.curl:
                self.session.curl.setopt(
                    CurlOpt.RESOLVE, [f"{hostname}:{port}:{validated_ip}"]
                )
            response = self.session.get(
                current_url,
                impersonate="chrome",
                timeout=5.0,
                allow_redirects=False,
            )

            # Follow redirects manually so each hop is validated against private network IPs
            if response.status_code in {301, 302, 303, 307, 308}:
                location = response.headers.get("location") or response.headers.get(
                    "Location"
                )
                if not location:
                    raise MetadataError(
                        message("message.theRedirectDestinationIsMissing")
                    )
                current_url = urljoin(current_url, location)
                continue

            if len(response.content) > 2 * 1024 * 1024:
                raise MetadataError(
                    message("message.thisPageIsLargerThanTheAllowedLimit")
                )
            if response.status_code >= 400:
                raise MetadataError(f"HTTP hata kodu: {response.status_code}")
            return response

        raise MetadataError(message("message.thisLinkRedirectsTooManyTimes"))

    def fetch(self, url: str):
        try:
            return self._request(url)
        except Exception as error:
            raise MetadataError(
                message("message.weCouldnTLoadAPreviewForThisLink")
            ) from error

    def fetch_json(self, url: str) -> dict[str, object]:
        try:
            payload = self._request(url).json()
            if not isinstance(payload, dict):
                raise ValueError("JSON nesnesi bekleniyordu.")
            return payload
        except Exception as error:
            raise MetadataError(
                message("message.weCouldnTGetAPreviewFromThisProvider")
            ) from error
