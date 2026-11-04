"""상품 API — Supabase 대신 가짜 Database 를 넣어 응답 모양 · 오류 처리를 확인한다(네트워크 없음)."""

import pytest
from fastapi.testclient import TestClient

from accio_api.db import DatabaseError, get_db
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

    async def search(self, q, *, limit, category=None):
        if self.fail:
            raise DatabaseError("down")
        self.calls.append(("search", q, limit, category))
        return [ROW]

    async def product(self, product_id):
        return DETAIL if product_id == "g-0701" else None

    async def related(self, keyword, exclude_id, *, limit):
        self.calls.append(("related", keyword, exclude_id, limit))
        return [{**ROW, "id": "g-0702"}]

    async def ping(self):
        return None


@pytest.fixture
def fake():
    db = FakeDb()
    app.dependency_overrides[get_db] = lambda: db
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
    assert fake.calls == [("search", "캠핑 의자", 10, None)]


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
    try:
        response = client.get("/api/search", params={"q": "의자"})
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 502
    assert response.json()["detail"] == "상품 저장소에 연결하지 못했어요"
