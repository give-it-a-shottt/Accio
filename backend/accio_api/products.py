from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query

from accio_api.db import Database, get_db
from accio_api.gemini import QueryParser, breaker, get_parser
from accio_api.schemas import Interpreted, ProductDetail, ProductSummary, SearchResponse

router = APIRouter(prefix="/api")
Db = Annotated[Database, Depends(get_db)]
Parser = Annotated[QueryParser | None, Depends(get_parser)]


@router.get("/search")
async def search(
    db: Db,
    parser: Parser,
    q: Annotated[str, Query(max_length=200)] = "",
    category: str | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 60,
    mode: Literal["auto", "keyword"] = "auto",
) -> SearchResponse:
    """auto: Gemini 가 검색어를 조건으로 해석해 SQL 필터로 넘긴다(P3). 실패하면 S0 키워드 검색.
    keyword: 검색어 그대로(S0) — 시험지 비교용."""
    query = q.strip()
    fallback_reason: str | None = None

    if mode == "auto" and query:
        if parser is None:
            fallback_reason = "no_key"
        elif not breaker.available():
            fallback_reason = "cooldown"  # 방금 Gemini 가 연달아 늦어 잠시 쉬는 중
        else:
            try:
                parsed = await parser.parse(query)
            except TimeoutError:
                breaker.failure()
                fallback_reason = "timeout"
            except Exception:  # noqa: BLE001 — 해석이 어떤 이유로 실패해도 검색은 계속돼야 한다
                breaker.failure()
                fallback_reason = "error"
            else:
                breaker.success()
                # 종류는 필터로(다른 종류가 섞이지 않게), 종류 이름 + 특징은 구절 그대로 점수로
                rows = await db.search(
                    query,
                    limit=limit,
                    category=category or parsed.category,
                    price_min=parsed.price_min,
                    price_max=parsed.price_max,
                    exclude=parsed.exclude,
                    keyword_in=list(parsed.product_types),
                    terms=[*parsed.product_types, *parsed.terms],
                )
                products = [ProductSummary.from_row(row) for row in rows]
                return SearchResponse(
                    query=query,
                    mode="parsed",
                    interpreted=Interpreted(**parsed.model_dump()),
                    total=len(products),
                    products=products,
                )

    rows = await db.search(query, limit=limit, category=category)
    products = [ProductSummary.from_row(row) for row in rows]
    return SearchResponse(query=query, fallback_reason=fallback_reason, total=len(products), products=products)


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
