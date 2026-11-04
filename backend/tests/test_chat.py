"""AI 채팅 — 가짜 Gemini(ChatAssistant)와 가짜 DB 로 흐름 · 실패 처리를 확인한다."""

import pytest
from fastapi.testclient import TestClient

from accio_api.chat import ChatParse, ChatWrite, get_assistant
from accio_api.db import get_db
from accio_api.main import app

ROW = {
    "id": "g-0702", "name": "초경량 네이비 로우 캠핑 체어", "brand": "캠프레이", "category": "캠핑",
    "keyword": "캠핑 의자", "price": 32000, "discount_rate": 20, "rating": 4.8, "review_count": 2150,
    "delivery": ["무료배송"], "tags": ["가벼움", "네이비"], "image_url": "/products/camping-chair-2.webp",
}


class FakeDb:
    def __init__(self, rows=None):
        self.rows = [ROW] if rows is None else rows
        self.calls = []

    async def search(self, q, **kwargs):
        self.calls.append((q, kwargs))
        return self.rows


class FakeAssistant:
    def __init__(self, parse=None, write=None, parse_error=None, write_error=None):
        self._parse, self._write = parse, write
        self.parse_error, self.write_error = parse_error, write_error
        self.previous = "unset"

    async def parse(self, message, previous):
        self.previous = previous
        if self.parse_error:
            raise self.parse_error
        return self._parse

    async def write(self, message, interpreted, products, total):
        if self.write_error:
            raise self.write_error
        return self._write


CHAIR = ChatParse(shopping=True, product_types=["캠핑 의자"], terms=["경량"], category="캠핑", price_min=None,
                  price_max=50000, exclude=[])
WRITE = ChatWrite(reply=["가벼운 캠핑 의자 1개를 찾았어요."], chips=["더 저렴한 걸로", "네이비만", "접이식 말고"])

client = TestClient(app)


@pytest.fixture(autouse=True)
def fresh_breaker():
    from accio_api.gemini import breaker

    breaker.failures, breaker.until = 0, 0.0
    yield


@pytest.fixture
def setup():
    def apply(db=None, assistant=None):
        app.dependency_overrides[get_db] = lambda: db or FakeDb()
        app.dependency_overrides[get_assistant] = lambda: assistant
    yield apply
    app.dependency_overrides.clear()


def test_chat_searches_with_parsed_conditions_and_writes_reply(setup):
    db, assistant = FakeDb(), FakeAssistant(parse=CHAIR, write=WRITE)
    setup(db, assistant)
    body = client.post("/api/chat", json={"message": "5만원 이하 가벼운 캠핑 의자"}).json()
    assert body["kind"] == "search"
    assert body["reply"] == ["가벼운 캠핑 의자 1개를 찾았어요."]
    assert body["chips"] == ["더 저렴한 걸로", "네이비만", "접이식 말고"]
    assert body["interpreted"]["productTypes"] == ["캠핑 의자"] and body["interpreted"]["priceMax"] == 50000
    assert body["products"][0]["id"] == "g-0702"
    _, kwargs = db.calls[0]
    assert kwargs["keyword_in"] == ["캠핑 의자"] and kwargs["price_max"] == 50000


def test_previous_conditions_are_passed_to_gemini(setup):
    assistant = FakeAssistant(parse=CHAIR, write=WRITE)
    setup(FakeDb(), assistant)
    previous = {"productTypes": ["캠핑 의자"], "terms": [], "category": "캠핑", "priceMin": None,
                "priceMax": None, "exclude": []}
    client.post("/api/chat", json={"message": "5만원 이하로", "previous": previous})
    assert assistant.previous.product_types == ["캠핑 의자"]


def test_off_topic_message_gets_guidance_without_search(setup):
    db = FakeDb()
    off = CHAIR.model_copy(update={"shopping": False})
    setup(db, FakeAssistant(parse=off))
    body = client.post("/api/chat", json={"message": "오늘 날씨 어때?"}).json()
    assert body["kind"] == "chat" and body["products"] == [] and db.calls == []


def test_parse_failure_falls_back_to_rule_parse(setup):
    db = FakeDb()
    setup(db, FakeAssistant(parse_error=TimeoutError()))
    body = client.post("/api/chat", json={"message": "접이식 말고 5만원 이하 캠핑 의자"}).json()
    assert body["kind"] == "keyword" and body["total"] == 1
    _, kwargs = db.calls[0]
    assert kwargs["keyword_in"] == ["캠핑 의자"] and kwargs["price_max"] == 50000 and kwargs["exclude"] == ["접이식"]


def test_rule_parse_carries_previous_type_for_refinement():
    from accio_api.chat import rule_parse
    from accio_api.schemas import Interpreted

    previous = Interpreted(product_types=["캠핑 의자"], terms=["경량"], category="캠핑", price_min=None,
                           price_max=None, exclude=[])
    refined = rule_parse("5만원 이하로", previous)
    assert refined.product_types == ["캠핑 의자"] and refined.price_max == 50000 and "경량" in refined.terms
    assert rule_parse("3만원대 텀블러", None).model_dump() | {} == {
        "product_types": ["텀블러"], "terms": [], "category": None, "price_min": 30000, "price_max": 39999,
        "exclude": [],
    }
    assert rule_parse("만원 이하 립밤", None).price_max == 10000
    # 종류 이름 낱말이 떨어져 있어도 잡는다
    assert rule_parse("캠핑 갈 때 쓸 가벼운 의자 찾아줘", None).product_types == ["캠핑 의자"]


def test_template_reply_mentions_type_price_exclude_only():
    from accio_api.chat import template_reply
    from accio_api.schemas import Interpreted

    i = Interpreted(product_types=["캠핑 의자"], terms=["경량"], category=None, price_min=None, price_max=50000,
                    exclude=["접이식"])
    assert template_reply(3, i)[0].startswith("캠핑 의자 · 50,000원 이하 · 접이식 제외 조건으로 3개를 찾았어요.")


def test_write_failure_uses_template_reply(setup):
    setup(FakeDb(), FakeAssistant(parse=CHAIR, write_error=ValueError("x")))
    body = client.post("/api/chat", json={"message": "캠핑 의자"}).json()
    assert body["kind"] == "search" and "1개를 찾았어요" in body["reply"][0]


def test_no_results_says_so_without_calling_writer(setup):
    setup(FakeDb(rows=[]), FakeAssistant(parse=CHAIR, write_error=AssertionError("부르면 안 됨")))
    body = client.post("/api/chat", json={"message": "캠핑 의자"}).json()
    assert body["total"] == 0 and "찾지 못했어요" in body["reply"][0]


def test_message_length_is_limited(setup):
    setup(FakeDb(), None)
    assert client.post("/api/chat", json={"message": "가" * 301}).status_code == 422
    assert client.post("/api/chat", json={"message": ""}).status_code == 422


def test_breaker_skips_gemini_after_repeated_failures(setup):
    from accio_api.gemini import breaker

    assistant = FakeAssistant(parse_error=TimeoutError())
    setup(FakeDb(), assistant)
    client.post("/api/chat", json={"message": "캠핑 의자"})
    client.post("/api/chat", json={"message": "캠핑 의자"})
    assert not breaker.available()
    assistant.previous = "unset"
    body = client.post("/api/chat", json={"message": "캠핑 의자"}).json()
    assert body["kind"] == "keyword" and assistant.previous == "unset"  # 쉬는 동안은 Gemini 를 부르지 않았다
