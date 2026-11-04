"""data/products.json + images.json (+ reviews.json) 을 합쳐 Supabase 에 넣는다(있으면 덮어쓴다).

    uv run python scripts/load_products.py            적재
    uv run python scripts/load_products.py --dry-run  합친 결과만 보기

필요한 값(.env): SUPABASE_URL, SUPABASE_SECRET_KEY (쓰기 권한 — 이 스크립트에서만 쓴다)
예전 이름 SUPABASE_SERVICE_ROLE_KEY 도 읽는다.
reviews.json 이 있으면 reviews 테이블(002_reviews.sql)에도 넣는다.
"""

import json
import os
import sys
from collections import Counter
from pathlib import Path

import httpx
from dotenv import load_dotenv

from seeds import SEEDS

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS = ROOT / "data" / "products.json"
IMAGES = ROOT / "data" / "images.json"
REVIEWS = ROOT / "data" / "reviews.json"
CHUNK = 200


def to_rows(
    products: dict[str, list[dict]], images: dict[str, list[dict]], reviews: dict[str, list[list[dict]]]
) -> tuple[list[dict], list[dict]]:
    """seeds 순서대로 id 를 매긴다(g-0001 …). 사진은 상품이 고른 번호(image)를, 없으면 차례로 돌려 쓴다.
    리뷰 id 는 상품 id 뒤에 -r1, -r2 … 를 붙인다."""
    rows: list[dict] = []
    review_rows: list[dict] = []
    for keywords in SEEDS.values():
        for keyword, _ in keywords:
            photos = images.get(keyword) or []
            if not photos:
                sys.exit(f"'{keyword}' 사진이 없어요 — scripts/prepare_images.py build 를 먼저 실행해 주세요")
            keyword_reviews = reviews.get(keyword, [])
            for index, product in enumerate(products.get(keyword, [])):
                chosen = product.get("image")
                photo = photos[chosen - 1] if chosen and chosen <= len(photos) else photos[index % len(photos)]
                product_id = f"g-{len(rows) + 1:04d}"
                rows.append(
                    {
                        "id": product_id,
                        "name": product["name"],
                        "brand": product["brand"],
                        "category": product["category"],
                        "keyword": keyword,
                        "price": product["price"],
                        "discount_rate": product["discount_rate"],
                        "rating": product["rating"],
                        "review_count": product["review_count"],
                        "delivery": product["delivery"],
                        "description": product["description"],
                        "specs": product["specs"],
                        "tags": product["tags"],
                        "search_text": " ".join([product["name"], product["brand"], keyword, *product["tags"]]),
                        "image_url": photo["src"],
                        "image_alt": photo["alt"],
                        # 직접 만든 이미지는 출처가 없다. 외부 사진을 쓸 때만 채운다
                        "photographer": photo.get("photographer", ""),
                        "photographer_url": photo.get("photographer_url", ""),
                        "photo_page_url": photo.get("page_url", ""),
                    }
                )
                product_reviews = keyword_reviews[index] if index < len(keyword_reviews) else []
                for number, review in enumerate(product_reviews, 1):
                    review_rows.append(
                        {
                            "id": f"{product_id}-r{number}",
                            "product_id": product_id,
                            "author": review["author"],
                            "rating": review["rating"],
                            "days_ago": review["days_ago"],
                            "body": review["body"],
                            "highlight": review.get("highlight"),
                            "helpful": review["helpful"],
                            "topics": review["topics"],
                        }
                    )
    return rows, review_rows


def auth_headers(key: str) -> dict[str, str]:
    """새 키(sb_secret_…)는 apikey 헤더만 쓴다. 예전 키(JWT, eyJ…)는 Authorization 에도 넣는다."""
    headers = {"apikey": key}
    if key.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {key}"
    return headers


def upsert(client: httpx.Client, table: str, rows: list[dict]) -> None:
    for start in range(0, len(rows), CHUNK):
        response = client.post(f"/{table}", params={"on_conflict": "id"}, json=rows[start : start + CHUNK])
        if response.is_error:
            sys.exit(f"{table} 적재 실패 {response.status_code}: {response.text}")


def main() -> None:
    for path, script in ((PRODUCTS, "generate_products.py"), (IMAGES, "prepare_images.py build")):
        if not path.exists():
            sys.exit(f"{path.relative_to(ROOT)} 이 없어요 — scripts/{script} 를 먼저 실행해 주세요")
    products = json.loads(PRODUCTS.read_text(encoding="utf-8"))
    images = json.loads(IMAGES.read_text(encoding="utf-8"))
    reviews = json.loads(REVIEWS.read_text(encoding="utf-8")) if REVIEWS.exists() else {}
    rows, review_rows = to_rows(products, images, reviews)

    print(f"상품 {len(rows)}개 · 리뷰 {len(review_rows)}개")
    for category, count in Counter(r["category"] for r in rows).items():
        print(f"  {category:<5} {count}")
    if "--dry-run" in sys.argv:
        return

    load_dotenv(ROOT / ".env")
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        sys.exit(".env 에 SUPABASE_URL, SUPABASE_SECRET_KEY 를 넣어 주세요")

    headers = {**auth_headers(key), "Prefer": "resolution=merge-duplicates,return=minimal"}
    with httpx.Client(base_url=f"{url.rstrip('/')}/rest/v1", headers=headers, timeout=30) as client:
        upsert(client, "products", rows)
        if review_rows:
            # 상품을 다시 만들면 리뷰 수가 바뀔 수 있다 — 예전 리뷰가 남지 않게 비우고 새로 넣는다
            response = client.delete("/reviews", params={"id": "not.is.null"})
            if response.is_error:
                sys.exit(f"reviews 비우기 실패 {response.status_code}: {response.text}")
            upsert(client, "reviews", review_rows)
    print("Supabase 적재 끝")


if __name__ == "__main__":
    # Windows 터미널(cp949)에서도 한글 · 기호 출력이 깨지거나 멈추지 않게
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
