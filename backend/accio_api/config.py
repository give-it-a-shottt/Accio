from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """환경 변수 — 로컬은 레포 루트 .env, 배포는 Vercel 프로젝트 설정에서 읽는다."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Accio API"


@lru_cache
def get_settings() -> Settings:
    return Settings()
