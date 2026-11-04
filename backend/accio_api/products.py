from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from accio_api.db import Database, get_db
from accio_api.schemas import ProductDetail, ProductSummary, SearchResponse

router = APIRouter(prefix="/api")
Db = Annotated[Database, Depends(get_db)]


@router.get("/search")
async def search(
    db: Db,
    q: Annotated[str, Query(max_length=200)] = "",
    category: str | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 60,
) -> SearchResponse:
    """S0 — 검색어를 그대로 낱말로 나눠 키워드 점수로 찾는다(LLM 없음)."""
    query = q.strip()
    rows = await db.search(query, limit=limit, category=category)
    products = [ProductSummary.from_row(row) for row in rows]
    return SearchResponse(query=query, total=len(products), products=products)


@router.get("/products/{product_id}")
async def product(db: Db, product_id: str) -> ProductDetail:
    row = await db.product(product_id)
    if row is None:
        raise HTTPException(status_code=404, detail="없는 상품이에요")
    return ProductDetail.from_row(row)


@router.get("/products/{product_id}/related")
async def related(db: Db, product_id: str, limit: Annotated[int, Query(ge=1, le=20)] = 8) -> list[ProductSummary]:
    """함께 보면 좋은 상품 — 지금은 같은 키워드의 인기순. P4 에서 임베딩 '비슷한 상품'으로 바꾼다."""
    row = await db.product(product_id)
    if row is None:
        raise HTTPException(status_code=404, detail="없는 상품이에요")
    rows = await db.related(row["keyword"], product_id, limit=limit)
    return [ProductSummary.from_row(r) for r in rows]


@router.get("/health/db")
async def health_db(db: Db) -> dict[str, str]:
    """DB 까지 닿는지 — Vercel Cron 이 매일 불러 Supabase 무료 프로젝트가 잠들지 않게 한다."""
    await db.ping()
    return {"status": "ok"}

