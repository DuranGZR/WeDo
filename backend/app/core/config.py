from functools import lru_cache

from pydantic import Field, PostgresDsn, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env",),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "WeDo API"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = False
    docs_enabled: bool = True
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    database_url: PostgresDsn = Field(
        default="postgresql+psycopg://wedo:wedo@localhost:5432/wedo"
    )
    jwt_secret_key: str = "development-only-change-me-32chars!"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    frontend_url: str = "http://localhost:3000"
    mobile_scheme: str = "wedo"
    cors_origins: list[str] = []
    rate_limit_per_minute: int = Field(default=120, ge=1, le=10_000)
    auth_rate_limit_per_minute: int = Field(default=10, ge=1, le=100)
    metadata_enabled: bool = True
    storage_endpoint: str | None = None
    storage_bucket: str | None = None
    storage_access_key: str | None = None
    storage_secret_key: str | None = None
    expo_push_url: str = "https://exp.host/--/api/v2/push/send"

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.environment == "production" and self.jwt_secret_key.startswith(
            "development-only"
        ):
            raise ValueError("Production ortamında JWT_SECRET_KEY değiştirilmelidir.")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
