"""Gemini 질의 해석(P3) — 자연어 검색어를 '찾을 낱말 · 카테고리 · 가격 · 제외어'로 나눈다.

거르기(가격 · 카테고리 · 제외어)는 LLM 이 하지 않는다. 여기서는 해석만 하고, 실제 필터는 SQL(search_products)이 한다.
실패하거나 느리면(PARSE_TIMEOUT) 호출한 쪽이 S0 키워드 검색으로 넘어간다.
"""

import asyncio
import time
from collections import OrderedDict
from typing import Literal

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from accio_api.config import get_settings

Category = Literal["패션", "뷰티", "식품", "생활", "주방", "가전", "디지털", "캠핑", "반려동물", "유아동", "가구"]

# 쇼핑몰의 상품 분류 — 실제 쇼핑몰의 카테고리 트리처럼 해석기에 알려 준다(scripts/seeds.py 와 같은 값)
CATALOG: dict[str, list[str]] = {
    "패션": ["경량 패딩", "울 코트", "니트", "방수 운동화", "트레킹 자켓"],
    "뷰티": ["수분크림", "선크림", "립밤", "클렌징폼", "핸드크림"],
    "식품": ["샤인머스캣", "사과", "밀키트", "견과류", "닭가슴살"],
    "생활": ["화장지", "세탁세제", "극세사 이불", "수건", "디퓨저"],
    "주방": ["프라이팬", "냄비 세트", "밀폐용기", "텀블러", "도마"],
    "가전": ["전기 담요", "미니 히터", "가습기", "무선 청소기", "에어프라이어"],
    "디지털": ["무선 이어폰", "블루투스 스피커", "보조배터리", "무선 마우스", "키보드"],
    "캠핑": ["캠핑 의자", "캠핑 랜턴", "캠핑 테이블", "코펠", "침낭"],
    "반려동물": ["캣타워", "고양이 스크래쳐", "강아지 간식", "배변패드", "고양이 모래"],
    "유아동": ["아기 물티슈", "유아 로션", "유아 식기", "블록 장난감", "유아 내복"],
    "가구": ["무드등", "책상", "수납장", "쿠션", "원목 선반"],
}

# 상품 종류는 분류 목록 안에서만 고르게 한다(구조화 출력의 enum) — 엉뚱한 종류 이름이 나오지 않게
ProductType = Literal[tuple(k for keywords in CATALOG.values() for k in keywords)]  # type: ignore[valid-type]

PARSE_TIMEOUT = 6.0
CACHE_SIZE = 500


class Breaker:
    """Gemini 가 연달아 늦거나 실패하면 잠시 부르지 않는다(차단기).
    서비스가 느려진 동안 사용자가 질문마다 시간 초과(6초)를 기다리지 않고 바로 키워드 · 규칙 검색으로 답을 받게."""

    def __init__(self, threshold: int = 2, cooldown: float = 60.0) -> None:
        self.threshold, self.cooldown = threshold, cooldown
        self.failures = 0
        self.until = 0.0

    def available(self) -> bool:
        return time.monotonic() >= self.until

    def failure(self) -> None:
        self.failures += 1
        if self.failures >= self.threshold:
            self.until = time.monotonic() + self.cooldown
            self.failures = 0

    def success(self) -> None:
        self.failures = 0


# 서버(서버리스 인스턴스) 하나에 하나 — 헤더 검색과 AI 채팅이 함께 쓴다
breaker = Breaker()


class ParsedQuery(BaseModel):
    product_types: list[ProductType] = Field(
        description="사용자가 사려는 상품 종류(분류 목록에서). 보통 1개, 여러 종류가 다 맞을 때만 여럿. 모르면 빈 목록"
    )
    terms: list[str] = Field(
        description="원하는 특징 낱말 0~4개(상품 종류 이름은 빼고). 사람 말을 상품 글의 말로 바꾼다"
        "(예: '클릭 소리 안 나는' → '무소음', '가벼운' → '경량'). 조사 · 요청어 · 가격 · 제외어는 넣지 않는다"
    )
    category: Category | None = Field(description="분명할 때만 카테고리 하나. 여러 분류에 걸치거나 애매하면 null")
    price_min: int | None = Field(description="최저 가격(원). 말하지 않았으면 null")
    price_max: int | None = Field(
        description="최고 가격(원). '5만원 이하' → 50000, '3만원대' → 39999. 말하지 않았으면 null"
    )
    exclude: list[str] = Field(description="빼 달라고 한 특징 · 종류 낱말('접이식 말고' → '접이식'). 없으면 빈 목록")


PROMPT = """한국 쇼핑몰 검색창에 들어온 말을 검색 조건으로 바꿔 주세요.

쇼핑몰의 상품 분류(카테고리: 상품 종류들)
{catalog}

규칙
- product_types 는 사용자가 사려는 것만. 함께 쓰는 다른 물건은 넣지 않는다(마우스를 찾으면 키보드 ✕)
  '선물' · '단백질 간식'처럼 여러 종류가 다 답이 되면 맞는 종류를 모두
- terms 는 원하는 특징만, 상품 글에 쓰일 말로. 동의어가 있으면 1~2개 더(예: 무소음, 저소음)
- '저렴한' · '싼' 처럼 숫자 없는 가격 표현은 price 를 정하지 않고 terms 에 '가성비' 를 넣는다
- 'N만원대' 는 N만원 이상 (N+1)만원 미만. '이하' · '안쪽' 은 price_max, '이상' 은 price_min
- 상품 종류가 분명하면 category 를 정하고, '선물'처럼 여러 분류에 걸치면 null

검색어: {query}
"""


def _catalog_text() -> str:
    return "\n".join(f"- {category}: {', '.join(keywords)}" for category, keywords in CATALOG.items())


class QueryParser:
    """Gemini 호출 + 같은 검색어 메모리 캐시(서버리스 인스턴스가 살아 있는 동안)."""

    def __init__(self, api_key: str, model: str) -> None:
        self.client = genai.Client(api_key=api_key)
        self.model = model
        self.cache: OrderedDict[str, ParsedQuery] = OrderedDict()
        self.config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ParsedQuery,
            temperature=0,
            # 해석은 짧은 일이라 생각을 가장 짧게 — 응답 시간이 가장 큰 비용.
            # Gemini 3 계열은 thinking_budget=0 을 받지 않고(400) thinking_level 을 쓴다
            thinking_config=types.ThinkingConfig(thinking_level="minimal"),
        )

    async def parse(self, query: str) -> ParsedQuery:
        key = " ".join(query.lower().split())
        if key in self.cache:
            self.cache.move_to_end(key)
            return self.cache[key]
        prompt = PROMPT.format(catalog=_catalog_text(), query=query)
        response = await asyncio.wait_for(
            self.client.aio.models.generate_content(model=self.model, contents=prompt, config=self.config),
            timeout=PARSE_TIMEOUT,
        )
        parsed: ParsedQuery = response.parsed
        if parsed is None:
            raise ValueError("Gemini 응답을 해석하지 못했어요")
        parsed = tidy(parsed)
        self.cache[key] = parsed
        if len(self.cache) > CACHE_SIZE:
            self.cache.popitem(last=False)
        return parsed


def tidy(parsed: ParsedQuery) -> ParsedQuery:
    """모델이 이상한 값을 줘도 검색이 깨지지 않게 다듬는다."""
    types = list(dict.fromkeys(parsed.product_types))[:6]
    terms = [t for t in dict.fromkeys(t.strip() for t in parsed.terms if t.strip()) if t not in types][:6]
    exclude = list(dict.fromkeys(e.strip() for e in parsed.exclude if e.strip()))[:5]
    low, high = parsed.price_min, parsed.price_max
    if low is not None and low <= 0:
        low = None
    if high is not None and high <= 0:
        high = None
    if low is not None and high is not None and low > high:
        low, high = high, low
    return ParsedQuery(
        product_types=types, terms=terms, category=parsed.category, price_min=low, price_max=high, exclude=exclude
    )


_parser: QueryParser | None = None


def get_parser() -> QueryParser | None:
    """GEMINI_API_KEY 가 없으면 None — 검색은 S0 키워드로만 돈다."""
    global _parser
    settings = get_settings()
    if not settings.gemini_api_key:
        return None
    if _parser is None:
        _parser = QueryParser(settings.gemini_api_key, settings.parse_model)
    return _parser
