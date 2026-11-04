"""AI 채팅(대화형 검색) — 질문을 이전 대화 조건과 합쳐 해석하고, 찾은 상품을 보고 짧게 답한다.

흐름: ① Gemini 해석(이전 조건 + 새 말 → 전체 조건, 쇼핑과 무관한 말 구분) → ② SQL 검색(헤더 검색과 같은 함수)
     → ③ Gemini 답변(상위 상품을 보고 1~2문장 + 이어서 물어볼 칩 3개).
①이 실패하면 키워드 검색, ③이 실패하면 정해 둔 문장으로 답한다 — 대화는 멈추지 않는다.
"""

import asyncio
import re
from typing import Annotated

from fastapi import APIRouter, Depends
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from accio_api.db import Database, get_db
from accio_api.gemini import (
    CATALOG,
    PARSE_TIMEOUT,
    ParsedQuery,
    ProductType,
    QueryParser,
    _catalog_text,
    breaker,
    get_parser,
    tidy,
)
from accio_api.schemas import CamelModel, Interpreted, ProductSummary

router = APIRouter(prefix="/api")
RESULT_LIMIT = 12
REPLY_TIMEOUT = 6.0


# ── 요청 · 응답 ───────────────────────────────────────────────────────────


class ChatRequest(CamelModel):
    message: str = Field(min_length=1, max_length=300)
    # 이 대화에서 마지막으로 쓴 검색 조건 — '5만원 이하로' 같은 이어지는 말을 합치는 데 쓴다
    previous: Interpreted | None = None


class ChatResponse(CamelModel):
    reply: list[str]
    chips: list[str]
    # search = 상품을 찾았다, chat = 쇼핑과 무관한 말이라 안내만, keyword = AI 해석 실패로 키워드 검색
    kind: str
    interpreted: Interpreted | None = None
    total: int = 0
    products: list[ProductSummary] = []


# ── Gemini 스키마 · 프롬프트 ─────────────────────────────────────────────────


class ChatParse(BaseModel):
    shopping: bool = Field(description="상품을 찾거나 고르는 말이면 true, 인사 · 잡담 · 쇼핑과 무관한 질문이면 false")
    product_types: list[ProductType] = Field(description="사려는 상품 종류(분류 목록에서). 모르면 빈 목록")
    terms: list[str] = Field(description="원하는 특징 낱말 0~4개(상품 종류 이름은 빼고), 상품 글에 쓰일 말로")
    category: str | None = Field(description="분명할 때만 카테고리 하나, 아니면 null")
    price_min: int | None = Field(description="최저 가격(원), 없으면 null")
    price_max: int | None = Field(description="최고 가격(원), 없으면 null")
    exclude: list[str] = Field(description="빼 달라고 한 낱말, 없으면 빈 목록")


class ChatWrite(BaseModel):
    reply: list[str] = Field(description="답변 1~2문장(해요체). 찾은 상품을 근거로 무엇을 골랐는지 · 고를 때 볼 점")
    chips: list[str] = Field(description="이어서 물어볼 만한 짧은 말 3개. 예: '5만원 이하로', '더 가벼운 걸로'")


PARSE_PROMPT = """한국 쇼핑몰의 AI 쇼핑 도우미예요. 사용자의 말을 검색 조건으로 바꿔 주세요.

쇼핑몰의 상품 분류(카테고리: 상품 종류들)
{catalog}

이전 검색 조건(이 대화에서 마지막으로 찾은 것): {previous}

규칙
- 새 말이 이전 검색을 다듬는 말이면('5만원 이하로', '네이비만', '접이식 말고', '더 가벼운 걸로')
  이전 조건에 합쳐서 전체 조건을 다시 쓴다(이전 종류 · 조건을 유지하고 바뀐 것만 바꾼다)
- 다른 상품을 찾는 말이면 이전 조건은 버리고 새로 쓴다
- product_types 는 사려는 것만(함께 쓰는 다른 물건 ✕). 여러 종류가 다 답이면 모두
- 숫자 없는 '저렴한'은 price 대신 terms 에 '가성비'. 'N만원대'는 N만원 이상 (N+1)만원 미만
- 인사 · 잡담 · 쇼핑과 무관한 질문이면 shopping=false

사용자: {message}
"""

WRITE_PROMPT = """한국 쇼핑몰의 AI 쇼핑 도우미예요. 사용자 말과 찾은 상품을 보고 짧게 답해 주세요.

사용자: {message}
적용한 조건: {conditions}
찾은 상품 {total}개 중 상위:
{products}

규칙
- 1~2문장, 해요체. 몇 개 찾았는지 + 고를 때 볼 점(가격대 · 특징 차이)을 상품 이름을 들어 짧게
- 위 목록에 없는 상품 · 수치는 지어내지 않는다. 데모용 가상 상품이라는 말은 하지 않는다
- chips 는 이어서 할 만한 말 3개(조건 좁히기 · 바꾸기), 각 12자 안팎
"""


def describe(interpreted: Interpreted | None) -> str:
    if interpreted is None:
        return "없음"
    parts = []
    if interpreted.product_types:
        parts.append(f"종류 {', '.join(interpreted.product_types)}")
    if interpreted.terms:
        parts.append(f"특징 {', '.join(interpreted.terms)}")
    if interpreted.price_min is not None:
        parts.append(f"{interpreted.price_min:,}원 이상")
    if interpreted.price_max is not None:
        parts.append(f"{interpreted.price_max:,}원 이하")
    if interpreted.exclude:
        parts.append(f"제외 {', '.join(interpreted.exclude)}")
    return " · ".join(parts) or "없음"


class ChatAssistant:
    def __init__(self, client: genai.Client, model: str) -> None:
        self.client = client
        self.model = model

    def _config(self, schema: type[BaseModel], temperature: float) -> types.GenerateContentConfig:
        return types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
            temperature=temperature,
            thinking_config=types.ThinkingConfig(thinking_level="minimal"),
        )

    async def parse(self, message: str, previous: Interpreted | None) -> ChatParse:
        prompt = PARSE_PROMPT.format(catalog=_catalog_text(), previous=describe(previous), message=message)
        response = await asyncio.wait_for(
            self.client.aio.models.generate_content(
                model=self.model, contents=prompt, config=self._config(ChatParse, 0)
            ),
            timeout=PARSE_TIMEOUT,
        )
        if response.parsed is None:
            raise ValueError("Gemini 응답을 해석하지 못했어요")
        return response.parsed

    async def write(
        self, message: str, interpreted: Interpreted, products: list[ProductSummary], total: int
    ) -> ChatWrite:
        lines = "\n".join(
            f"- {p.name} · {p.price:,}원 · ★{p.rating} · 태그 {', '.join(p.tags[:4])}" for p in products[:5]
        )
        prompt = WRITE_PROMPT.format(message=message, conditions=describe(interpreted), total=total, products=lines)
        response = await asyncio.wait_for(
            self.client.aio.models.generate_content(
                model=self.model, contents=prompt, config=self._config(ChatWrite, 0.6)
            ),
            timeout=REPLY_TIMEOUT,
        )
        if response.parsed is None:
            raise ValueError("Gemini 응답을 해석하지 못했어요")
        return response.parsed


def get_assistant(parser: Annotated[QueryParser | None, Depends(get_parser)]) -> ChatAssistant | None:
    return ChatAssistant(parser.client, parser.model) if parser else None


# ── Gemini 가 안 될 때 쓰는 규칙 해석 ──────────────────────────────────────────

ALL_TYPES = [keyword for keywords in CATALOG.values() for keyword in keywords]
_PRICE_RANGE = re.compile(r"(\d+)\s*만\s*원?\s*대")
_PRICE_MAX = re.compile(r"(\d*)\s*만\s*원?\s*(?:이하|이내|안쪽|아래|까지|미만)")
_PRICE_MIN = re.compile(r"(\d+)\s*만\s*원?\s*(?:이상|넘는|부터)")
_EXCLUDE = re.compile(r"(\S+?)\s*(?:말고|빼고|제외|없는)")
_STOP = re.compile(r"(찾아줘|추천해줘|보여줘|알려줘|으로|로만|만|좀|거|것|걸로|으로만)$")


def rule_parse(message: str, previous: Interpreted | None) -> ParsedQuery:
    """규칙으로 가격 · 제외어 · 상품 종류만 뽑는다. 종류가 없으면 이전 대화의 종류를 이어받는다(다듬는 말)."""
    price_min = price_max = None
    if match := _PRICE_RANGE.search(message):
        n = int(match.group(1))
        price_min, price_max = n * 10000, (n + 1) * 10000 - 1
    else:
        if match := _PRICE_MAX.search(message):
            price_max = int(match.group(1) or 1) * 10000
        if match := _PRICE_MIN.search(message):
            price_min = int(match.group(1)) * 10000
    exclude = [m.group(1) for m in _EXCLUDE.finditer(message)]
    # 종류 이름의 낱말이 모두 들어 있으면 그 종류('캠핑 갈 때 쓸 가벼운 의자' → 캠핑 의자)
    types = [t for t in ALL_TYPES if all(part in message for part in t.split())]
    carried = previous if previous is not None and not types else None
    without_price = _PRICE_RANGE.sub("", _PRICE_MAX.sub("", _PRICE_MIN.sub("", message)))
    words = [_STOP.sub("", w) for w in re.split(r"\s+", without_price)]
    terms = [w for w in words if len(w) >= 2 and w not in exclude and all(w not in t for t in types)]
    return tidy(
        ParsedQuery(
            product_types=types or (list(carried.product_types) if carried else []),
            terms=terms[:4] if not carried else [*carried.terms, *terms][:4],
            category=carried.category if carried else None,
            price_min=price_min if price_min is not None else (carried.price_min if carried else None),
            price_max=price_max if price_max is not None else (carried.price_max if carried else None),
            exclude=[*(carried.exclude if carried else []), *exclude],
        )
    )


# ── 답 만들기 ────────────────────────────────────────────────────────────


def template_reply(total: int, interpreted: Interpreted | None) -> list[str]:
    """Gemini 답변이 없을 때 — 종류 · 가격 · 제외만 짧게 말한다(특징 낱말까지 늘어놓으면 어색하다)."""
    if total == 0:
        return ["조건에 맞는 상품을 찾지 못했어요. 조건을 조금 줄여서 다시 물어봐 주세요."]
    parts = []
    if interpreted is not None:
        if interpreted.product_types:
            parts.append(" · ".join(interpreted.product_types))
        if interpreted.price_min is not None and interpreted.price_max is not None:
            parts.append(f"{interpreted.price_min:,}~{interpreted.price_max:,}원")
        elif interpreted.price_max is not None:
            parts.append(f"{interpreted.price_max:,}원 이하")
        elif interpreted.price_min is not None:
            parts.append(f"{interpreted.price_min:,}원 이상")
        if interpreted.exclude:
            parts.append(f"{', '.join(interpreted.exclude)} 제외")
    lead = f"{' · '.join(parts)} 조건으로 " if parts else ""
    return [f"{lead}{total}개를 찾았어요. 많이 고르는 순으로 보여 드려요."]


DEFAULT_CHIPS = ["더 저렴한 걸로", "리뷰 많은 순으로", "다른 색으로"]
OFF_TOPIC_CHIPS = ["캠핑 갈 때 쓸 가벼운 의자", "3만원대 집들이 선물", "클릭 소리 안 나는 마우스"]


@router.post("/chat")
async def chat(
    body: ChatRequest,
    db: Annotated[Database, Depends(get_db)],
    assistant: Annotated[ChatAssistant | None, Depends(get_assistant)],
) -> ChatResponse:
    message = body.message.strip()

    parsed: ChatParse | None = None
    if assistant is not None and breaker.available():
        try:
            parsed = await assistant.parse(message, body.previous)
            breaker.success()
        except Exception:  # noqa: BLE001 — 해석이 실패해도 규칙 해석으로 답한다
            breaker.failure()
            parsed = None

    if parsed is not None and not parsed.shopping:
        return ChatResponse(
            reply=["저는 상품을 찾아 드리는 AI예요. 찾고 싶은 물건과 쓰임새 · 예산을 말해 주면 골라 드릴게요."],
            chips=OFF_TOPIC_CHIPS,
            kind="chat",
        )

    # Gemini 가 안 되면(키 없음 · 시간 초과 · 오류) 규칙으로 가격 · 제외어 · 종류만 뽑아 이어간다
    kind = "search" if parsed is not None else "keyword"
    conditions = (
        tidy(ParsedQuery(**parsed.model_dump(exclude={"shopping"})))
        if parsed is not None
        else rule_parse(message, body.previous)
    )
    interpreted = Interpreted(**conditions.model_dump())
    rows = await db.search(
        message,
        limit=RESULT_LIMIT,
        category=conditions.category,
        price_min=conditions.price_min,
        price_max=conditions.price_max,
        exclude=conditions.exclude,
        keyword_in=list(conditions.product_types),
        terms=[*conditions.product_types, *conditions.terms],
    )
    products = [ProductSummary.from_row(r) for r in rows]

    reply, chips = template_reply(len(products), interpreted), DEFAULT_CHIPS
    if products and assistant is not None and parsed is not None and breaker.available():
        try:
            written = await assistant.write(message, interpreted, products, len(products))
            reply = [line for line in written.reply if line.strip()][:2] or reply
            chips = [chip for chip in written.chips if chip.strip()][:3] or chips
        except Exception:  # noqa: BLE001 — 답변 작성이 실패해도 결과는 보여 준다
            breaker.failure()

    return ChatResponse(
        reply=reply, chips=chips, kind=kind, interpreted=interpreted, total=len(products), products=products
    )
