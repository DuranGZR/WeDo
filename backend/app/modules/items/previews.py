from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt

from app.core.config import settings


def preview_path(item_id: UUID) -> str:
    return f"/api/v1/items/{item_id}/preview"


def signed_preview_url(item_id: UUID, viewer_id: UUID) -> str:
    token = jwt.encode(
        {
            "sub": str(viewer_id),
            "item_id": str(item_id),
            "type": "item_preview",
            "exp": datetime.now(UTC) + timedelta(minutes=5),
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return f"{preview_path(item_id)}?token={token}"


def preview_viewer(item_id: UUID, token: str) -> UUID:
    claims = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
        options={"require": ["exp", "sub", "item_id", "type"]},
    )
    if claims["type"] != "item_preview" or claims["item_id"] != str(item_id):
        raise jwt.InvalidTokenError("invalid preview token scope")
    return UUID(claims["sub"])
