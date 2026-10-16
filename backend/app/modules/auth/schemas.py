from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.modules.users.schemas import UserResponse


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=2, max_length=80)
    device_id: str | None = Field(default=None, max_length=255)


class SignInRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    device_id: str | None = Field(default=None, max_length=255)


class VerificationChallenge(BaseModel):
    verification_id: UUID
    email: EmailStr
    expires_in_seconds: int
    resend_after_seconds: int


class ResendVerificationRequest(BaseModel):
    verification_id: UUID


class VerifyEmailRequest(ResendVerificationRequest):
    code: str = Field(pattern=r"^[0-9]{6}$")


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class SignOutRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class AppleSignInRequest(BaseModel):
    identity_token: str = Field(min_length=1, max_length=16384)
    authorization_code: str | None = Field(default=None, min_length=1, max_length=4096)
    apple_user_id: str = Field(min_length=1, max_length=255)
    email: EmailStr | None = None
    display_name: str | None = Field(default=None, max_length=80)
    device_id: str | None = Field(default=None, max_length=255)


class GoogleSignInRequest(BaseModel):
    id_token: str = Field(min_length=1, max_length=16384)
    device_id: str | None = Field(default=None, max_length=255)


class AppleNotificationRequest(BaseModel):
    payload: str = Field(min_length=1, max_length=32768)
