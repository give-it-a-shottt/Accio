"""Gemini 로 상품마다 데모용 리뷰 4~5개를 만들어 data/reviews.json 에 저장한다.

    uv run python scripts/generate_reviews.py                        빠진 키워드만 만든다(이어서)
    uv run python scripts/generate_reviews.py --only "캠핑 의자,무드등"   그 키워드만 (다시) 만든다

먼저 data/products.json 이 있어야 한다(scripts/generate_products.py).
호출 수: 키워드 55개 × 1번 = 55번 — 키워드의 상품 20개를 한 번에 넘긴다.

리뷰는 상품 설명의 장점 · 아쉬운 점과 평점에 맞춘다. 상세 화면의 'AI 리뷰 요약'은 나중에 이 리뷰를
실제로 Gemini 가 요약하게 만든다(지금 화면의 고정 요약 문구를 대신한다).
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

from seeds import SEEDS

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS = ROOT / "data" / "products.json"
OUT = ROOT / "data" / "reviews.json"
DEFAULT_MODEL = "gemini-3.5-flash-lite"
GAP_SECONDS = 7
RETRIES = 3
Topic = Literal["품질", "배송", "가성비", "디자인", "사이즈"]


class GeneratedReview(BaseModel):
    author: str = Field(description="쇼핑몰 닉네임. 예: 캠핑초보, 자취3년차, 두아이맘. 실명 금지")
    rating: int = Field(description="별점 1~5")
    days_ago: int = Field(description="며칠 전에 썼는지 1~400")
    body: str = Field(description="리뷰 본문 1~3문장. 실제 구매자 말투(해요체)")
    highlight: str | None = Field(description="본문 안의 핵심 구절 그대로(2~8글자). 없으면 null")
    helpful: int = Field(description="'도움돼요' 수 0~60")
    topics: list[Topic] = Field(description="리뷰가 다루는 주제 1~2개")


class ProductReviews(BaseModel):
    index: int = Field(description="상품 번호(목록의 번호 그대로)")
    reviews: list[GeneratedReview]


class Batch(BaseModel):
    products: list[ProductReviews]


PROMPT = """한국 온라인 쇼핑몰의 데모용 상품 리뷰를 만들어 주세요.
아래 상품 {count}개 각각에 리뷰를 4~5개씩 씁니다.

규칙
- 리뷰 내용은 그 상품의 설명 · 스펙과 맞게. 설명에 적힌 아쉬운 점은 리뷰 중 하나 이상이 자연스럽게 언급
- 별점 분포는 상품 평점에 맞춘다(평점 4.8이면 대부분 5점, 4.2면 3~4점이 섞임). 1~2점도 드물게
- 같은 문장 · 같은 시작어를 반복하지 않는다. 길이 · 말투(짧은 한 줄, 자세한 후기)를 섞는다
- 실존 브랜드 · 실명 · 연락처 금지
- highlight 는 반드시 body 안에 그대로 들어 있는 구절

상품 목록
{products}
"""


def product_lines(products: list[dict]) -> str:
    lines = []
    for index, p in enumerate(products):
        specs = ", ".join(f"{s['label']} {s['value']}" for s in p["specs"])
        lines.append(f"[{index}] {p['name']} (평점 {p['rating']}) — {p['description']} / 스펙: {specs}")
    return "\n".join(lines)


def generate(client: genai.Client, model: str, products: list[dict]) -> dict[int, list[dict]]:
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=Batch,
        temperature=1.0,
    )
    prompt = PROMPT.format(count=len(products), products=product_lines(products))
    for attempt in range(1, RETRIES + 1):
        try:
            response = client.models.generate_content(model=model, contents=prompt, config=config)
            batch: Batch = response.parsed
            return {item.index: [r.model_dump() for r in item.reviews] for item in batch.products}
        except Exception as error:  # 한도 초과 · 일시 오류 — 잠깐 쉬고 다시
            if attempt == RETRIES:
                raise
            wait = 30 * attempt
            print(f"  실패({error.__class__.__name__}: {str(error)[:120]}) — {wait}초 뒤 다시")
            time.sleep(wait)
    return {}


def tidy(review: dict) -> dict:
    highlight = review.get("highlight")
    return {
        **review,
        "rating": min(5, max(1, review["rating"])),
        "days_ago": min(400, max(1, review["days_ago"])),
        "helpful": max(0, review["helpful"]),
        # 본문에 없는 구절은 강조할 수 없다
        "highlight": highlight if highlight and highlight in review["body"] else None,
        "topics": list(dict.fromkeys(review["topics"])),
    }


def main() -> None:
    load_dotenv(ROOT / ".env")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        sys.exit(".env 에 GEMINI_API_KEY 를 넣어 주세요")
    if not PRODUCTS.exists():
        sys.exit("먼저 scripts/generate_products.py 를 실행해 주세요")
    model = os.getenv("GEMINI_MODEL") or DEFAULT_MODEL
    client = genai.Client(api_key=api_key)

    products: dict[str, list[dict]] = json.loads(PRODUCTS.read_text(encoding="utf-8"))
    only = set(sys.argv[sys.argv.index("--only") + 1].split(",")) if "--only" in sys.argv else None
    # { 키워드: [ 상품 0번의 리뷰들, 상품 1번의 리뷰들, … ] } — 상품 순서는 products.json 과 같다
    saved: dict[str, list[list[dict]]] = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}

    for keywords in SEEDS.values():
        for keyword, _ in keywords:
            items = products.get(keyword)
            if not items:
                continue
            if (only is not None and keyword not in only) or (only is None and keyword in saved):
                continue
            print(f"{keyword} — 상품 {len(items)}개")
            by_index = generate(client, model, items)
            saved[keyword] = [[tidy(r) for r in by_index.get(i, [])] for i in range(len(items))]
            empty = sum(1 for reviews in saved[keyword] if not reviews)
            OUT.write_text(json.dumps(saved, ensure_ascii=False, indent=1), encoding="utf-8")
            total = sum(len(r) for r in saved[keyword])
            print(f"  리뷰 {total}개 저장" + (f"  ⚠ 리뷰 없는 상품 {empty}개" if empty else ""))
            time.sleep(GAP_SECONDS)

    total = sum(len(r) for reviews in saved.values() for r in reviews)
    print(f"\n{OUT.relative_to(ROOT)} — 키워드 {len(saved)}개, 리뷰 {total}개")


if __name__ == "__main__":
    # Windows 터미널(cp949)에서도 한글 · 기호 출력이 깨지거나 멈추지 않게
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
