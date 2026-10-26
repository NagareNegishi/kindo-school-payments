"""App settings read from the environment."""

from pydantic import field_validator
from pydantic_settings import BaseSettings


def to_asyncpg_url(url: str) -> str:
    """Convert a plain postgres URL (as Render provides) to the asyncpg form."""
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+asyncpg://" + url[len(prefix) :]
    return url


class Settings(BaseSettings):
    database_url: str
    frontend_origin: str = "http://localhost:5173"

    @field_validator("database_url")
    @classmethod
    def _asyncpg(cls, v: str) -> str:
        return to_asyncpg_url(v)


settings = Settings()
