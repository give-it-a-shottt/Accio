"""Gemini 로 데모용 가상 상품을 만들어 data/products.json 에 저장한다.

    uv run python scripts/generate_products.py                        빠진 키워드만 만든다(중간에 멈춰도 이어서)
    uv run python scripts/generate_products.py --only "캠핑 의자,무드등"   그 키워드만 (다시) 만든다

필요한 값(.env): GEMINI_API_KEY (선택: GEMINI_MODEL)
호출 수: 키워드 55개 × 1번 = 55번

왜 가상 상품인가: 네이버 쇼핑 검색 API 가 2026-07-31 에 종료됐고 대체 API 가 없다.
실존 브랜드 · 상품을 흉내 내지 않도록 브랜드는 지어낸 이름만 쓴다(화면에도 '데모용 가상 상품'으로 표시).

사진: 키워드마다 3장(scripts/image_subjects.py 의 생김새 설명). 그 설명을 함께 넘겨
상품마다 생김새가 맞는 사진 번호(image)를 고르게 한다 — 상세 화면에서 사진과 설명이 어긋나지 않게.
"""

import json
import os
import sys
import time
from collections import Counter
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from image_subjects import SUBJECTS, VARIANTS
from seeds import PER_KEYWORD, SEEDS

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "products.json"
# 무료 하루 한도가 넉넉한 Lite 를 기본으로 쓴다(.env GEMINI_MODEL 로 바꿀 수 있다)
DEFAULT_MODEL = "gemini-3.5-flash-lite"
# 무료 한도(분당 요청 수)에 걸리지 않게 호출 사이를 띄운다
GAP_SECONDS = 7
RETRIES = 3
# 지어낸 브랜드가 실존 브랜드를 닮았는지 거르는 목록(부분 일치). 걸리면 경고만 내고 사람이 보고 다시 만든다
REAL_BRANDS = [
    "바이오더마", "라로슈", "설화수", "이니스프리", "닥터자르트", "아이소이", "라운드랩", "토리든", "에스트라",
    "코베아", "스노우피크", "헬리녹스", "콜맨", "노스페이스", "코오롱", "블랙야크", "네파", "몽벨",
    "다이슨", "삼성", "엘지", "필립스", "샤오미", "드롱기", "쿠쿠", "쿠첸", "테팔", "해피콜", "락앤락",
    "이케아", "무인양품", "한샘", "까사미아", "애플", "소니", "로지텍", "앤커", "제이비엘",
    "나이키", "아디다스", "유니클로", "자라", "뉴발란스", "하기스", "보솜이", "크리넥스", "깨끗한나라",
    "페디그리", "로얄캐닌", "레고", "피셔프라이스", "스탠리", "써모스", "조셉조셉", "자연주의",
]


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
    image: int = Field(description="이 상품의 생김새와 맞는 사진 번호 1~3")


class Batch(BaseModel):
    products: list[GeneratedProduct]


PROMPT = """한국 온라인 쇼핑몰의 데모용 상품 데이터를 만들어 주세요.
카테고리: {category}
키워드: {keyword}
개수: {count}개

규칙
- 실제로 팔 법한 상품처럼 구체적으로. 다만 브랜드는 반드시 지어낸 이름(실존 브랜드 · 상표 금지,
  실존 브랜드를 살짝 바꾼 이름도 금지 — 예: 바이오더마 → 바이오더마틱 ✕)
- 브랜드는 {count}개 상품에 10개 이상 서로 다르게. 한 브랜드는 최대 3~4개 상품까지
- {count}개가 서로 겹치지 않게: 가격대(저가 · 중가 · 고가), 크기 · 용량, 대상(1인 · 가족 · 아이 · 반려동물), \
계절, 소재, 형태(예: 접이식 / 고정식)를 골고루 섞는다
- 자연어 검색 시험에 쓰니 '가벼움 · 저소음 · 대용량 · 방수 · 선물용'처럼 사람이 말로 찾을 특징을 상품마다 1~2개 분명히
- 가격은 한국 시장에서 그럴듯하게. 할인율 0인 상품도 몇 개 섞는다
- 설명에는 장점과 함께 아쉬운 점 하나를 솔직하게 쓴다

상품 사진 (이미 정해져 있다 — 상품을 사진에 맞춘다)
{photos}
- 상품마다 image 에 생김새가 맞는 사진 번호를 넣는다. 사진마다 {per_photo}개 안팎으로 골고루 나눈다
- 상품명 · 설명 · 스펙의 색 · 형태 · 소재가 고른 사진과 어긋나지 않게 한다
  (예: 2번 사진이 네이비 로우 체어면 그 사진을 고른 상품은 네이비 · 낮은 등받이)
"""


def slug(query: str) -> str:
    return query.replace(" ", "-")


def photo_lines(keyword: str, query: str) -> str:
    """사진 1~3번의 생김새 설명 — 영어 묘사 그대로 넘긴다(괄호 안 한글이 상품 종류)."""
    subjects = [SUBJECTS.get(slug(query), f"{query} ({keyword})"), *VARIANTS.get(slug(query), [])]
    return "\n".join(f"{i}. {subject}" for i, subject in enumerate(subjects, 1))


def generate(client: genai.Client, model: str, category: str, keyword: str, query: str) -> list[dict]:
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=Batch,
        temperature=1.0,
    )
    prompt = PROMPT.format(
        category=category,
        keyword=keyword,
        count=PER_KEYWORD,
        photos=photo_lines(keyword, query),
        per_photo=round(PER_KEYWORD / 3),
    )
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
        "image": min(3, max(1, product["image"])),
    }


def main() -> None:
    load_dotenv(ROOT / ".env")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        sys.exit(".env 에 GEMINI_API_KEY 를 넣어 주세요")
    model = os.getenv("GEMINI_MODEL") or DEFAULT_MODEL
    client = genai.Client(api_key=api_key)

    only = set(sys.argv[sys.argv.index("--only") + 1].split(",")) if "--only" in sys.argv else None
    saved: dict[str, list[dict]] = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}

    for category, keywords in SEEDS.items():
        for keyword, query in keywords:
            if (only is not None and keyword not in only) or (only is None and keyword in saved):
                continue
            print(f"{category} · {keyword} — {model}")
            products = [tidy(p, category, keyword) for p in generate(client, model, category, keyword, query)]
            saved[keyword] = products
            OUT.parent.mkdir(parents=True, exist_ok=True)
            OUT.write_text(json.dumps(saved, ensure_ascii=False, indent=1), encoding="utf-8")
            spread = [sum(p["image"] == i for p in products) for i in (1, 2, 3)]
            for product in products:
                hits = [b for b in REAL_BRANDS if b.lower() in product["brand"].lower().replace(" ", "")]
                if hits:
                    print(f"  ⚠ 실존 브랜드와 비슷함: {product['brand']} ({', '.join(hits)})")
            top = max(Counter(p["brand"] for p in products).values(), default=0)
            if top > 4:
                print(f"  ⚠ 한 브랜드가 {top}개 상품에 몰림")
            warn = "" if len(products) == PER_KEYWORD else f"  ⚠ {PER_KEYWORD}개가 아님"
            print(f"  {len(products)}개 저장 (사진 1/2/3: {spread[0]}/{spread[1]}/{spread[2]}){warn}")
            time.sleep(GAP_SECONDS)

    total = sum(len(v) for v in saved.values())
    print(f"\n{OUT.relative_to(ROOT)} — 키워드 {len(saved)}개, 상품 {total}개")


if __name__ == "__main__":
    # Windows 터미널(cp949)에서도 한글 · 기호 출력이 깨지거나 멈추지 않게
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
