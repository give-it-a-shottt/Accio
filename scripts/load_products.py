"""data/products.json + data/images.json 을 합쳐 Supabase products 테이블에 넣는다(있으면 덮어쓴다).

    uv run python scripts/load_products.py            적재
    uv run python scripts/load_products.py --dry-run  합친 결과만 보기

필요한 값(.env): SUPABASE_URL, SUPABASE_SECRET_KEY (쓰기 권한 — 이 스크립트에서만 쓴다)
예전 이름 SUPABASE_SERVICE_ROLE_KEY 도 읽는다.
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
CHUNK = 200


def to_rows(products: dict[str, list[dict]], images: dict[str, list[dict]]) -> list[dict]:
    """seeds 순서대로 id 를 매긴다(g-0001 …). 사진은 상품이 고른 번호(image)를, 없으면 차례로 돌려 쓴다."""
    rows = []
    for keywords in SEEDS.values():
        for keyword, _ in keywords:
            photos = images.get(keyword) or []
            if not photos:
                sys.exit(f"'{keyword}' 사진이 없어요 — scripts/prepare_images.py build 를 먼저 실행해 주세요")
            for index, product in enumerate(products.get(keyword, [])):
                chosen = product.get("image")
                photo = photos[chosen - 1] if chosen and chosen <= len(photos) else photos[index % len(photos)]
                rows.append(
                    {
                        "id": f"g-{len(rows) + 1:04d}",
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
    return rows


def auth_headers(key: str) -> dict[str, str]:
    """새 키(sb_secret_…)는 apikey 헤더만 쓴다. 예전 키(JWT, eyJ…)는 Authorization 에도 넣는다."""
    headers = {"apikey": key}
    if key.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {key}"
    return headers


def main() -> None:
    for path, script in ((PRODUCTS, "generate_products.py"), (IMAGES, "prepare_images.py build")):
        if not path.exists():
            sys.exit(f"{path.relative_to(ROOT)} 이 없어요 — scripts/{script} 를 먼저 실행해 주세요")
    products = json.loads(PRODUCTS.read_text(encoding="utf-8"))
    images = json.loads(IMAGES.read_text(encoding="utf-8"))
    rows = to_rows(products, images)

    print(f"상품 {len(rows)}개")
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
        for start in range(0, len(rows), CHUNK):
            response = client.post("/products", params={"on_conflict": "id"}, json=rows[start : start + CHUNK])
            if response.is_error:
                sys.exit(f"적재 실패 {response.status_code}: {response.text}")
    print("Supabase 적재 끝")


if __name__ == "__main__":
    # Windows 터미널(cp949)에서도 한글 · 기호 출력이 깨지거나 멈추지 않게
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    main()
