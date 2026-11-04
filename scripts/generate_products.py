"""Gemini 로 데모용 가상 상품을 만들어 data/products.json 에 저장한다.

    uv run python scripts/generate_products.py           빠진 키워드만 만든다(중간에 멈춰도 이어서)
    uv run python scripts/generate_products.py --redo 캠핑 의자   그 키워드만 다시 만든다

필요한 값(.env): GEMINI_API_KEY (선택: GEMINI_MODEL)
호출 수: 키워드 55개 × 1번 = 55번

왜 가상 상품인가: 네이버 쇼핑 검색 API 가 2026-07-31 에 종료됐고 대체 API 가 없다.
실존 브랜드 · 상품을 흉내 내지 않도록 브랜드는 지어낸 이름만 쓴다(화면에도 '데모용 가상 상품'으로 표시).
"""

import json
import os
import sys
import time
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from seeds import PER_KEYWORD, SEEDS

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "products.json"
DEFAULT_MODEL = "gemini-3.6-flash"
# 무료 한도(분당 요청 수)에 걸리지 않게 호출 사이를 띄운다
GAP_SECONDS = 7
RETRIES = 3


class Spec(BaseModel):
    label: str = Field(description="항목 이름. 예: 무게, 소재, 용량, 크기")
    value: str = Field(description="값. 예: 1.2kg, 알루미늄, 500ml")


class GeneratedProduct(BaseModel):
    name: str = Field(description="쇼핑몰 상품명. 핵심 특징을 앞에 둔다. 예: '초경량 접이식 캠핑 의자 등받이형'")
    brand: str = Field(description="지어낸 한국어 또는 영어 브랜드 이름. 실존 브랜드 금지")
    price: int = Field(description="판매가(원). 100원 단위")
    discount_rate: int = Field(description="정가 대비 할인율(%) 0~60. 할인 없으면 0")
    rating: float = Field(description="평점 3.5~5.0, 소수 첫째 자리")
    review_count: int = Field(description="리뷰 수 0~8000")
    delivery: list[Literal["무료배송", "오늘 출발", "내일 도착"]]
    description: str = Field(description="상품 설명 2~3문장. 누구에게 · 어떤 상황에 좋은지와 단점 하나")
    specs: list[Spec] = Field(description="스펙 3~5개")
    tags: list[str] = Field(description="용도 · 상황 · 대상 태그 4~8개. 예: 캠핑, 1인용, 겨울, 자취방, 선물용, 아이용")


class Batch(BaseModel):
    products: list[GeneratedProduct]


PROMPT = """한국 온라인 쇼핑몰의 데모용 상품 데이터를 만들어 주세요.
카테고리: {category}
키워드: {keyword}
개수: {count}개

규칙
- 실제로 팔 법한 상품처럼 구체적으로. 다만 브랜드는 반드시 지어낸 이름(실존 브랜드 · 상표 금지)
- {count}개가 서로 겹치지 않게: 가격대(저가 · 중가 · 고가), 크기 · 용량, 대상(1인 · 가족 · 아이 · 반려동물), \
계절, 소재, 형태(예: 접이식 / 고정식)를 골고루 섞는다
- 자연어 검색 시험에 쓰니 '가벼움 · 저소음 · 대용량 · 방수 · 선물용'처럼 사람이 말로 찾을 특징을 상품마다 1~2개 분명히
- 가격은 한국 시장에서 그럴듯하게. 할인율 0인 상품도 몇 개 섞는다
- 설명에는 장점과 함께 아쉬운 점 하나를 솔직하게 쓴다
"""


def generate(client: genai.Client, model: str, category: str, keyword: str) -> list[dict]:
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=Batch,
        temperature=1.0,
    )
    prompt = PROMPT.format(category=category, keyword=keyword, count=PER_KEYWORD)
    for attempt in range(1, RETRIES + 1):
        try:
            response = client.models.generate_content(model=model, contents=prompt, config=config)
            batch: Batch = response.parsed
            return [p.model_dump() for p in batch.products]
        except Exception as error:  # 한도 초과 · 일시 오류 — 잠깐 쉬고 다시
            if attempt == RETRIES:
                raise
            wait = 30 * attempt
            print(f"  실패({error.__class__.__name__}: {str(error)[:120]}) — {wait}초 뒤 다시")
            time.sleep(wait)
    return []


def tidy(product: dict, category: str, keyword: str) -> dict:
    """모델이 범위를 벗어난 값을 줘도 화면이 깨지지 않게 다듬는다."""
    return {
        **product,
        "category": category,
        "keyword": keyword,
        "price": max(100, round(product["price"] / 100) * 100),
        "discount_rate": min(60, max(0, product["discount_rate"])),
        "rating": round(min(5.0, max(0.0, product["rating"])), 1),
        "review_count": max(0, product["review_count"]),
        "delivery": sorted(set(product["delivery"]), key=["무료배송", "오늘 출발", "내일 도착"].index),
        "tags": list(dict.fromkeys(t.strip() for t in product["tags"] if t.strip())),
    }


def main() -> None:
    load_dotenv(ROOT / ".env")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        sys.exit(".env 에 GEMINI_API_KEY 를 넣어 주세요")
    model = os.getenv("GEMINI_MODEL") or DEFAULT_MODEL
    client = genai.Client(api_key=api_key)

    redo = " ".join(sys.argv[sys.argv.index("--redo") + 1 :]) if "--redo" in sys.argv else None
    saved: dict[str, list[dict]] = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}

    for category, keywords in SEEDS.items():
        for keyword, _ in keywords:
            if keyword in saved and keyword != redo:
                continue
            print(f"{category} · {keyword} — {model}")
            products = [tidy(p, category, keyword) for p in generate(client, model, category, keyword)]
            saved[keyword] = products
            OUT.parent.mkdir(parents=True, exist_ok=True)
            OUT.write_text(json.dumps(saved, ensure_ascii=False, indent=1), encoding="utf-8")
            print(f"  {len(products)}개 저장")
            time.sleep(GAP_SECONDS)

    total = sum(len(v) for v in saved.values())
    print(f"\n{OUT.relative_to(ROOT)} — 키워드 {len(saved)}개, 상품 {total}개")


if __name__ == "__main__":
    main()
