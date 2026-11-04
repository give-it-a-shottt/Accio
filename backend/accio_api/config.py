from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """환경 변수 — 로컬은 레포 루트 .env, 배포는 Vercel 프로젝트 설정에서 읽는다."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Accio API"
    supabase_url: str = ""
    # 서버는 읽기 전용 공개 키만 쓴다(쓰기는 로컬 적재 스크립트의 secret 키). 예전 이름 anon 도 읽는다
    supabase_key: str = Field("", validation_alias=AliasChoices("SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY"))
    # 없으면 검색은 S0 키워드로만 돈다
    gemini_api_key: str = ""
    # .env 에서 비워 두면(GEMINI_MODEL=) 기본 모델
    gemini_model: str = ""

    @property
    def parse_model(self) -> str:
        return self.gemini_model or "gemini-3.5-flash-lite"


@lru_cache
def get_settings() -> Settings:
    return Settings()
