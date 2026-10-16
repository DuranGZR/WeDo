from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.exceptions import AppError
from app.core.localization import message


def register_exception_handlers(application: FastAPI) -> None:
    @application.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                    "request_id": request.state.request_id,
                }
            },
        )

    @application.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        detail = (
            exc.detail
            if isinstance(exc.detail, str)
            else message("message.weCouldnTCompleteYourRequest")
        )
        return JSONResponse(
            status_code=exc.status_code,
            headers=exc.headers,
            content={
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message_key": getattr(detail, "key", None),
                    "message": detail,
                    "details": {},
                    "request_id": request.state.request_id,
                }
            },
        )

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "validation_error",
                    "message": message("message.pleaseCheckTheInformationYouEntered"),
                    "details": exc.errors(),
                    "request_id": request.state.request_id,
                }
            },
        )
