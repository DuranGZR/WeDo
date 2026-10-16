import ipaddress
from collections import defaultdict, deque
from time import monotonic

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.localization import message


def _is_valid_ip(address: str) -> bool:
    try:
        ipaddress.ip_address(address)
        return True
    except ValueError:
        return False


def _is_trusted_proxy_connection(host: str) -> bool:
    if settings.trust_proxy_headers or host in settings.trusted_proxies:
        return True
    try:
        ip = ipaddress.ip_address(host)
        return ip.is_private or ip.is_loopback
    except ValueError:
        return False


def extract_client_ip(request: Request) -> str:
    direct_ip = request.client.host if request.client else "unknown"

    # Inspect forwarded headers only from a trusted proxy or private gateway.
    if _is_trusted_proxy_connection(direct_ip):
        cf_connecting_ip = request.headers.get("cf-connecting-ip")
        if cf_connecting_ip and _is_valid_ip(cf_connecting_ip.strip()):
            return cf_connecting_ip.strip()

        x_real_ip = request.headers.get("x-real-ip")
        if x_real_ip and _is_valid_ip(x_real_ip.strip()):
            return x_real_ip.strip()

        x_forwarded_for = request.headers.get("x-forwarded-for")
        if x_forwarded_for:
            candidate = x_forwarded_for.split(",")[0].strip()
            if _is_valid_ip(candidate):
                return candidate

    return direct_ip


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.requests: dict[str, deque[float]] = defaultdict(deque)
        self.last_cleanup = monotonic()
        self.cleanup_interval = 60.0
        self.max_tracked_keys = 10_000

    def _cleanup_stale_buckets(self, now: float) -> None:
        if (
            now - self.last_cleanup < self.cleanup_interval
            and len(self.requests) < self.max_tracked_keys
        ):
            return
        self.last_cleanup = now
        stale_keys = [
            key
            for key, timestamps in self.requests.items()
            if not timestamps or now - timestamps[-1] >= 60
        ]
        for key in stale_keys:
            del self.requests[key]

        if len(self.requests) > self.max_tracked_keys:
            sorted_keys = sorted(
                self.requests.keys(),
                key=lambda k: self.requests[k][-1] if self.requests[k] else 0.0,
            )
            for key in sorted_keys[: len(self.requests) - self.max_tracked_keys]:
                del self.requests[key]

    async def dispatch(self, request: Request, call_next):
        now = monotonic()
        self._cleanup_stale_buckets(now)
        is_auth_attempt = request.method == "POST" and request.url.path in {
            "/api/v1/auth/sign-in",
            "/api/v1/auth/sign-up",
            "/api/v1/auth/change-password",
            "/api/v1/auth/apple",
            "/api/v1/auth/google",
            "/api/v1/auth/verify-email",
            "/api/v1/auth/resend-verification",
            "/legal/deletion-requests",
        }
        limit = (
            settings.auth_rate_limit_per_minute
            if is_auth_attempt
            else settings.rate_limit_per_minute
        )
        client_host = extract_client_ip(request)
        key = f"{client_host}:{request.url.path}" if is_auth_attempt else client_host
        bucket = self.requests[key]
        while bucket and now - bucket[0] >= 60:
            bucket.popleft()
        if not bucket and key in self.requests:
            del self.requests[key]
            bucket = self.requests[key]
        if len(bucket) >= limit:
            from fastapi.responses import JSONResponse

            return JSONResponse(
                status_code=429,
                headers={"Retry-After": "60"},
                content={
                    "error": {
                        "code": "rate_limited",
                        "message": (
                            message("message.tooManyAttemptsPleaseTryAgainInAMinute")
                        ),
                        "details": {},
                        "request_id": getattr(request.state, "request_id", None),
                    }
                },
            )
        bucket.append(now)
        return await call_next(request)


def register_rate_limit(application: FastAPI) -> None:
    application.add_middleware(RateLimitMiddleware)
