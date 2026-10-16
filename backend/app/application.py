import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings
from app.core.exception_handlers import register_exception_handlers
from app.core.localization import LanguageMiddleware
from app.core.middleware import register_middlewares
from app.core.rate_limit import register_rate_limit


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    from app.modules.auth.apple_jobs import revocation_loop

    task = None
    if (
        settings.apple_private_key.get_secret_value()
        and settings.apple_token_encryption_key.get_secret_value()
    ):
        task = asyncio.create_task(revocation_loop())
    try:
        yield
    finally:
        if task is not None:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task


def create_application() -> FastAPI:
    is_docs_enabled = settings.docs_enabled and settings.environment != "production"
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        lifespan=lifespan,
        docs_url="/docs" if is_docs_enabled else None,
        redoc_url="/redoc" if is_docs_enabled else None,
        openapi_url="/openapi.json" if is_docs_enabled else None,
    )
    register_middlewares(application)
    register_rate_limit(application)
    application.add_middleware(LanguageMiddleware)
    register_exception_handlers(application)
    if settings.cors_origins:
        from fastapi.middleware.cors import CORSMiddleware

        application.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    application.include_router(api_router)
    from app.modules.invitations.web import web_router

    application.include_router(web_router)
    from app.modules.legal.web import legal_router

    application.include_router(legal_router)
    return application
