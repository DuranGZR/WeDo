from collections import defaultdict, deque
from time import monotonic

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.requests: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        now = monotonic()
        is_auth_attempt = request.method == "POST" and request.url.path in {
            "/api/v1/auth/sign-in",
            "/api/v1/auth/sign-up",
            "/api/v1/auth/change-password",
        }
        limit = (
            settings.auth_rate_limit_per_minute
            if is_auth_attempt
            else settings.rate_limit_per_minute
        )
        client_host = request.client.host if request.client else "unknown"
        key = f"{client_host}:{request.url.path}" if is_auth_attempt else client_host
        bucket = self.requests[key]
        while bucket and now - bucket[0] >= 60:
            bucket.popleft()
        if len(bucket) >= limit:
            from fastapi.responses import JSONResponse

            return JSONResponse(
                status_code=429,
                headers={"Retry-After": "60"},
                content={
                    "error": {
                        "code": "rate_limited",
                        "message": (
                            "Çok fazla deneme yapıldı. "
                            "Lütfen bir dakika sonra tekrar dene."
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
