from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse

from app.core.localization import current_language, message
from app.modules.legal.render import render_legal_page
from app.modules.legal.service import (
    DeletionDeliveryError,
    DeletionRequest,
    send_deletion_request,
)

legal_router = APIRouter()


@legal_router.post("/legal/deletion-requests", status_code=202)
def request_account_deletion(data: DeletionRequest) -> dict[str, str]:
    try:
        send_deletion_request(data)
    except DeletionDeliveryError as error:
        raise HTTPException(
            status_code=503,
            detail=message("web.deletionFailed"),
        ) from error
    return {"message": message("web.deletionReceived")}


@legal_router.get("/legal", response_class=HTMLResponse)
@legal_router.get("/legal/privacy", response_class=HTMLResponse)
@legal_router.get("/legal/terms", response_class=HTMLResponse)
@legal_router.get("/legal/delete-account", response_class=HTMLResponse)
@legal_router.get("/legal/account-deletion", response_class=HTMLResponse)
def get_legal_page() -> HTMLResponse:
    return HTMLResponse(content=render_legal_page())


@legal_router.get("/privacy")
def redirect_privacy() -> RedirectResponse:
    return RedirectResponse(
        url=f"/legal?lang={current_language()}#privacy", status_code=302
    )


@legal_router.get("/terms")
def redirect_terms() -> RedirectResponse:
    return RedirectResponse(
        url=f"/legal?lang={current_language()}#terms", status_code=302
    )


@legal_router.get("/delete-account")
def redirect_delete_account() -> RedirectResponse:
    return RedirectResponse(
        url=f"/legal?lang={current_language()}#delete-account", status_code=302
    )
