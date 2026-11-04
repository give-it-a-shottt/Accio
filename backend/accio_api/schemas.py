"""API 응답 — 프론트 Product 타입(frontend/src/accio/data/catalog.ts)과 같은 이름(camelCase)으로 보낸다."""

from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, serialize_by_alias=True)


class ProductSummary(CamelModel):
    id: str
    name: str
    brand: str
    category: str
    keyword: str
    price: int
    discount_rate: int
    rating: float
    review_count: int
    delivery: list[str]
    tags: list[str]
    image: str
    # 목 데이터(mock)와 구분 — 화면이 '데모용 가상 상품' 표시를 붙인다
    source: Literal["generated"] = "generated"

    @classmethod
    def from_row(cls, row: dict) -> "ProductSummary":
        return cls(**{**row, "image": row["image_url"]})


class Spec(CamelModel):
    label: str
    value: str


class Review(CamelModel):
    id: str
    author: str
    rating: int
    days_ago: int
    body: str
    highlight: str | None = None
    helpful: int
    topics: list[str]


class ProductDetail(ProductSummary):
    description: str
    specs: list[Spec]
    reviews: list[Review]

    @classmethod
    def from_row(cls, row: dict) -> "ProductDetail":
        return cls(**{**row, "image": row["image_url"], "reviews": row.get("reviews") or []})


class Interpreted(CamelModel):
    """Gemini 가 이해한 검색 조건 — 화면의 '이렇게 이해했어요' 칩"""

    product_types: list[str]
    terms: list[str]
    category: str | None
    price_min: int | None
    price_max: int | None
    exclude: list[str]


class SearchResponse(CamelModel):
    query: str
    # keyword = 검색어 그대로(S0), parsed = Gemini 해석(P3), hybrid = 임베딩 혼합(P4)
    mode: Literal["keyword", "parsed", "hybrid"] = "keyword"
    interpreted: Interpreted | None = None
    # parsed 를 시도했다가 키워드로 돌아왔을 때 이유(시간 초과 · 오류 · 키 없음)
    fallback_reason: str | None = None
    total: int
    products: list[ProductSummary]
