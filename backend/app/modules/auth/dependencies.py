from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.api.dependencies import SessionDep
from app.modules.auth.models import RefreshSession
from app.modules.auth.tokens import decode_token
from app.modules.users.models import User
from app.modules.users.repository import user_repository

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    session: SessionDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kimlik doğrulaması gerekli.",
        )
    try:
        payload = decode_token(credentials.credentials, "access")
        user_id = UUID(payload["sub"])
        session_id = UUID(payload["session_id"])
    except (ValueError, KeyError, jwt.InvalidTokenError) as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token geçersiz.",
        ) from error
    user = user_repository.get_by_id(session, user_id)
    refresh_session = session.get(RefreshSession, session_id)
    if (
        user is None
        or not user.is_active
        or refresh_session is None
        or refresh_session.user_id != user.id
        or refresh_session.revoked_at is not None
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Kullanıcı bulunamadı."
        )
    return user


CurrentUserDep = Annotated[User, Depends(get_current_user)]
