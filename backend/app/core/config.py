from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/csp"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    ai_request_timeout_seconds: float = 30.0

    cache_ttl_seconds: int = 300

    cors_origins: str = "http://localhost:3000"

    admin_email: str = "admin@example.com"
    admin_password: str = "Admin123!"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def validate_for_production(self) -> None:
        """Fail fast if critical config is insecure."""
        _KNOWN_WEAK = {"change-me-in-production", "please-change-this-in-production-min-32-chars"}
        if self.jwt_secret_key in _KNOWN_WEAK:
            raise ValueError("JWT_SECRET_KEY must not use the default placeholder value")
        if len(self.jwt_secret_key) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters")


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    s.validate_for_production()
    return s
