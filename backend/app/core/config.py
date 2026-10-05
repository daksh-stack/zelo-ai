from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "Zilo-AI"
    APP_ENV: str = "development"
    DEBUG: bool = True

    SECRET_KEY: str
    DATABASE_URL: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"

    BACKEND_CORS_ORIGINS: List[str] = []

    # Phase 6
    SENTRY_DSN: str | None = None
    ENVIRONMENT: str = "development"  # development | production
    REMINDER_ENABLED: bool = True
    APP_PUBLIC_URL: str = "https://zelo-ai.vercel.app"
    SUPPORT_EMAIL: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"          # optional safety
    )

settings = Settings()