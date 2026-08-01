import secrets

from app.modules.auth.tokens import hash_token


def generate_invitation_token() -> str:
    return secrets.token_urlsafe(32)


def hash_invitation_token(token: str) -> str:
    return hash_token(token)
