"""Supabase(PostgREST) 읽기 — 서버리스(Vercel)라 연결 풀 대신 요청마다 HTTP 로 부른다."""

from collections.abc import AsyncIterator
from typing import Any

import httpx

from accio_api.config import get_settings

PRODUCT_DETAIL_COLUMNS = (
    "id,name,brand,category,keyword,price,discount_rate,rating,review_count,delivery,tags,image_url,"
    "description,specs"
)
PRODUCT_SUMMARY_COLUMNS = (
    "id,name,brand,category,keyword,price,discount_rate,rating,review_count,delivery,tags,image_url"
)
REVIEW_COLUMNS = "id,author,rating,days_ago,body,highlight,helpful,topics"


class DatabaseError(Exception):
    """Supabase 가 응답하지 않거나 오류를 돌려줬을 때 — 라우터가 502 로 바꾼다."""


class Database:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self.client = client

    async def _get(self, path: str, params: dict[str, Any]) -> list[dict]:
        try:
            response = await self.client.get(path, params=params)
        except httpx.HTTPError as error:
            raise DatabaseError(f"Supabase 연결 실패: {error.__class__.__name__}") from error
        if response.is_error:
            raise DatabaseError(f"Supabase {response.status_code}: {response.text[:200]}")
        return response.json()

    async def search(
        self,
        q: str,
        *,
        limit: int,
        category: str | None = None,
        price_min: int | None = None,
        price_max: int | None = None,
        exclude: list[str] | None = None,
    ) -> list[dict]:
        payload = {
            "q": q, "category_in": category, "price_min": price_min, "price_max": price_max,
            "exclude": exclude or [], "match_limit": limit,
        }
        try:
            response = await self.client.post("/rpc/search_products", json=payload)
        except httpx.HTTPError as error:
            raise DatabaseError(f"Supabase 연결 실패: {error.__class__.__name__}") from error
        if response.is_error:
            raise DatabaseError(f"Supabase {response.status_code}: {response.text[:200]}")
        return response.json()

    async def product(self, product_id: str) -> dict | None:
        rows = await self._get(
            "/products",
            {"select": f"{PRODUCT_DETAIL_COLUMNS},reviews({REVIEW_COLUMNS})", "id": f"eq.{product_id}",
             "reviews.order": "helpful.desc"},
        )
        return rows[0] if rows else None

    async def related(self, keyword: str, exclude_id: str, *, limit: int) -> list[dict]:
        return await self._get(
            "/products",
            {"select": PRODUCT_SUMMARY_COLUMNS, "keyword": f"eq.{keyword}", "id": f"neq.{exclude_id}",
             "order": "review_count.desc", "limit": limit},
        )

    async def ping(self) -> None:
        await self._get("/products", {"select": "id", "limit": 1})


def auth_headers(key: str) -> dict[str, str]:
    """새 키(sb_publishable_…)는 apikey 헤더만, 예전 키(JWT, eyJ…)는 Authorization 에도 넣는다."""
    headers = {"apikey": key}
    if key.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {key}"
    return headers


async def get_db() -> AsyncIterator[Database]:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_key:
        raise DatabaseError("SUPABASE_URL · SUPABASE_PUBLISHABLE_KEY 가 설정되지 않았어요")
    async with httpx.AsyncClient(
        base_url=f"{settings.supabase_url.rstrip('/')}/rest/v1",
        headers=auth_headers(settings.supabase_key),
        timeout=10,
    ) as client:
        yield Database(client)
