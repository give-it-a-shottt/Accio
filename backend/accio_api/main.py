from fastapi import APIRouter, FastAPI

from accio_api.config import get_settings

# 모든 경로는 /api 아래에 둔다.
# Vercel 은 원래 주소(/api/…)를 그대로 넘기고, 개발 중 Vite 프록시도 /api 를 그대로 넘긴다.
api = APIRouter(prefix="/api")


@api.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def create_app() -> FastAPI:
    app = FastAPI(title=get_settings().app_name)
    app.include_router(api)
    return app


app = create_app()
