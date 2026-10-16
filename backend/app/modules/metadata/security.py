import ipaddress
import socket
from urllib.parse import urlsplit

from app.core.localization import message
from app.modules.metadata.exceptions import MetadataError


def _is_public_ip(address: str) -> bool:
    try:
        ip = ipaddress.ip_address(address)
    except ValueError:
        return False
    return (
        ip.is_global
        and not ip.is_loopback
        and not ip.is_private
        and not ip.is_link_local
        and not ip.is_reserved
        and not ip.is_multicast
        and not ip.is_unspecified
    )


def validate_and_resolve_url(url: str) -> tuple[str, int, str]:
    """Validate URL, verify all resolved IPs are public, and return (hostname, port, validated_ip).

    This enables libcurl DNS pinning (CURLOPT_RESOLVE) to prevent DNS rebinding attacks.
    """
    parsed = urlsplit(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise MetadataError(message("message.onlyHttpAndHttpsLinksAreSupported"))

    port = parsed.port or (443 if parsed.scheme == "https" else 80)

    try:
        results = socket.getaddrinfo(parsed.hostname, port, type=socket.SOCK_STREAM)
        addresses = [result[4][0] for result in results]
    except socket.gaierror as error:
        raise MetadataError(
            message("message.weCouldnTResolveThisLinkSAddress")
        ) from error

    if not addresses or not all(_is_public_ip(address) for address in addresses):
        raise MetadataError(
            message("message.linksToPrivateOrLocalNetworksArenTAllowed")
        )

    if port not in {80, 443, 8080, 8443}:
        raise MetadataError(message("message.onlyStandardWebPortsAreSupported"))

    return parsed.hostname, port, addresses[0]


def validate_url(url: str) -> None:
    validate_and_resolve_url(url)
