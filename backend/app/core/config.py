"""App settings via pydantic-settings. Why: single source for env config."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SECRET_KEY: str = "change-me-dev-secret-key-min-32-chars"
    DATABASE_URL: str = "sqlite:///./nichedesk.db"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    AI_PROVIDER: str = "mock"
    CONFIDENCE_THRESHOLD: float = 0.25
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days (dev-friendly; tighten for prod)


settings = Settings()
