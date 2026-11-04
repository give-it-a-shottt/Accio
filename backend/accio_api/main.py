from fastapi import APIRouter, FastAPI, Request
from fastapi.responses import JSONResponse

from accio_api.config import get_settings
from accio_api.db import DatabaseError
from accio_api.products import router as products_router

# 모든 경로는 /api 아래에 둔다.
# Vercel 은 원래 주소(/api/…)를 그대로 넘기고, 개발 중 Vite 프록시도 /api 를 그대로 넘긴다.
api = APIRouter(prefix="/api")


@api.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


async def database_error(_request: Request, error: DatabaseError) -> JSONResponse:
    # 프론트는 502 를 받으면 목 데이터 검색으로 넘어가고 안내 토스트를 띄운다
    return JSONResponse(status_code=502, content={"detail": "상품 저장소에 연결하지 못했어요", "reason": str(error)})


def create_app() -> FastAPI:
    app = FastAPI(title=get_settings().app_name)
    app.include_router(api)
    app.include_router(products_router)
    app.add_exception_handler(DatabaseError, database_error)
    return app


app = create_app()
