"""상품 API — Supabase 대신 가짜 Database 를 넣어 응답 모양 · 오류 처리를 확인한다(네트워크 없음)."""

import pytest
from fastapi.testclient import TestClient

from accio_api.db import DatabaseError, get_db
from accio_api.gemini import ParsedQuery, get_parser
from accio_api.main import app

ROW = {
    "id": "g-0701", "name": "카키 그린 접이식 캠핑 암체어", "brand": "노마드피크", "category": "캠핑",
    "keyword": "캠핑 의자", "price": 45000, "discount_rate": 10, "rating": 4.6, "review_count": 1240,
    "delivery": ["무료배송"], "tags": ["캠핑", "컵홀더"], "image_url": "/products/camping-chair-1.webp",
}
DETAIL = {
    **ROW,
    "description": "컵홀더가 있는 암체어예요.",
    "specs": [{"label": "무게", "value": "3.2kg"}],
    "reviews": [{"id": "g-0701-r1", "author": "캠핑초보", "rating": 5, "days_ago": 12, "body": "튼튼해요",
                 "highlight": "튼튼", "helpful": 3, "topics": ["품질"]}],
}


class FakeDb:
    def __init__(self, fail: bool = False) -> None:
        self.fail = fail
        self.calls: list[tuple] = []

    async def search(self, q, *, limit, category=None, price_min=None, price_max=None, exclude=None,
                     keyword_in=None, terms=None):
        if self.fail:
            raise DatabaseError("down")
        self.calls.append(("search", q, limit, category, price_min, price_max, exclude))
        self.filters = {"keyword_in": keyword_in, "terms": terms}
        return [ROW]

    async def product(self, product_id):
        return DETAIL if product_id == "g-0701" else None

    async def related(self, keyword, exclude_id, *, limit):
        self.calls.append(("related", keyword, exclude_id, limit))
        return [{**ROW, "id": "g-0702"}]

    async def ping(self):
        return None


class FakeParser:
    def __init__(self, result: ParsedQuery | None = None, error: Exception | None = None) -> None:
        self.result, self.error = result, error

    async def parse(self, query):
        if self.error:
            raise self.error
        return self.result


@pytest.fixture
def fake():
    db = FakeDb()
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_parser] = lambda: None  # 기본은 Gemini 키 없음 → S0
    yield db
    app.dependency_overrides.clear()


client = TestClient(app)


def test_search_returns_camel_case_products(fake):
    response = client.get("/api/search", params={"q": "  캠핑 의자 ", "limit": 10})
    assert response.status_code == 200
    body = response.json()
    assert body["query"] == "캠핑 의자"
    assert body["mode"] == "keyword"
    assert body["total"] == 1
    product = body["products"][0]
    assert product["discountRate"] == 10 and product["reviewCount"] == 1240
    assert product["image"] == "/products/camping-chair-1.webp"
    assert product["source"] == "generated"
    assert fake.calls == [("search", "캠핑 의자", 10, None, None, None, None)]
    assert body["fallbackReason"] == "no_key"


def test_search_limit_is_bounded(fake):
    assert client.get("/api/search", params={"q": "의자", "limit": 500}).status_code == 422


def test_product_detail_includes_specs_and_reviews(fake):
    body = client.get("/api/products/g-0701").json()
    assert body["specs"] == [{"label": "무게", "value": "3.2kg"}]
    assert body["reviews"][0]["daysAgo"] == 12


def test_unknown_product_is_404(fake):
    assert client.get("/api/products/g-9999").status_code == 404
    assert client.get("/api/products/g-9999/related").status_code == 404


def test_related_uses_same_keyword_without_self(fake):
    body = client.get("/api/products/g-0701/related", params={"limit": 4}).json()
    assert [p["id"] for p in body] == ["g-0702"]
    assert ("related", "캠핑 의자", "g-0701", 4) in fake.calls


def test_database_failure_becomes_502():
    app.dependency_overrides[get_db] = lambda: FakeDb(fail=True)
    app.dependency_overrides[get_parser] = lambda: None
    try:
        response = client.get("/api/search", params={"q": "의자"})
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 502
    assert response.json()["detail"] == "상품 저장소에 연결하지 못했어요"


PARSED = ParsedQuery(product_types=["캠핑 테이블"], terms=["경량"], category="캠핑", price_min=None,
                     price_max=50000, exclude=["접이식"])


def test_parsed_search_passes_conditions_to_sql_filters(fake):
    app.dependency_overrides[get_parser] = lambda: FakeParser(PARSED)
    body = client.get("/api/search", params={"q": "접이식 말고 5만원 이하 캠핑 테이블"}).json()
    assert body["mode"] == "parsed"
    assert body["interpreted"] == {"productTypes": ["캠핑 테이블"], "terms": ["경량"], "category": "캠핑",
                                   "priceMin": None, "priceMax": 50000, "exclude": ["접이식"]}
    assert fake.calls == [("search", "접이식 말고 5만원 이하 캠핑 테이블", 60, "캠핑", None, 50000, ["접이식"])]
    # 종류는 필터로, 종류 이름 + 특징은 구절 그대로 점수로
    assert fake.filters == {"keyword_in": ["캠핑 테이블"], "terms": ["캠핑 테이블", "경량"]}


@pytest.mark.parametrize(("error", "reason"), [(TimeoutError(), "timeout"), (ValueError("bad"), "error")])
def test_parser_failure_falls_back_to_keyword_search(fake, error, reason):
    app.dependency_overrides[get_parser] = lambda: FakeParser(error=error)
    body = client.get("/api/search", params={"q": "캠핑 테이블"}).json()
    assert body["mode"] == "keyword"
    assert body["fallbackReason"] == reason
    assert fake.calls == [("search", "캠핑 테이블", 60, None, None, None, None)]


def test_keyword_mode_skips_gemini(fake):
    app.dependency_overrides[get_parser] = lambda: FakeParser(error=AssertionError("부르면 안 됨"))
    body = client.get("/api/search", params={"q": "캠핑 테이블", "mode": "keyword"}).json()
    assert body["mode"] == "keyword" and body["fallbackReason"] is None


def test_tidy_fixes_swapped_and_invalid_prices():
    from accio_api.gemini import tidy

    parsed = tidy(ParsedQuery(product_types=["캠핑 의자", "캠핑 의자"], terms=[" 경량 ", "경량", "", "캠핑 의자"],
                              category=None, price_min=50000, price_max=30000, exclude=["", "접이식"]))
    assert parsed.product_types == ["캠핑 의자"]
    assert parsed.terms == ["경량"] and parsed.exclude == ["접이식"]
    assert (parsed.price_min, parsed.price_max) == (30000, 50000)
    empty = ParsedQuery(product_types=[], terms=["a"], category=None, price_min=0, price_max=-1, exclude=[])
    assert tidy(empty).price_max is None
