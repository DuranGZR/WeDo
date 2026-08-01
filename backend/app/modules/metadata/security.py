import ipaddress
import socket
from urllib.parse import urlsplit

from app.modules.metadata.exceptions import MetadataError


def _is_public_ip(address: str) -> bool:
    ip = ipaddress.ip_address(address)
    return not (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_reserved
        or ip.is_multicast
        or ip.is_unspecified
    )


def validate_url(url: str) -> None:
    parsed = urlsplit(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise MetadataError("Yalnızca http ve https bağlantıları desteklenir.")
    try:
        addresses = {
            result[4][0]
            for result in socket.getaddrinfo(
                parsed.hostname, parsed.port, type=socket.SOCK_STREAM
            )
        }
    except socket.gaierror as error:
        raise MetadataError("Bağlantı adresi çözümlenemedi.") from error
    if not addresses or not all(_is_public_ip(address) for address in addresses):
        raise MetadataError("Özel veya yerel ağ adreslerine erişilemez.")
