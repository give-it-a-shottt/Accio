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


class SearchResponse(CamelModel):
    query: str
    # S0 은 검색어 그대로(keyword). P3 에서 Gemini 해석(parsed), P4 에서 임베딩 혼합(hybrid)
    mode: Literal["keyword", "parsed", "hybrid"] = "keyword"
    total: int
    products: list[ProductSummary]
