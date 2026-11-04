"""scripts/data/naver_raw.json 을 정리해 Supabase products 테이블에 넣는다(있으면 덮어쓴다).

    uv run python scripts/load_products.py            적재
    uv run python scripts/load_products.py --dry-run  정리 결과만 보기

필요한 값(.env): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (쓰기 권한 — 이 스크립트에서만 쓴다)
"""

import html
import json
import os
import re
import sys
from collections import Counter
from pathlib import Path

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "scripts" / "data" / "naver_raw.json"
TAG = re.compile(r"</?b>")
CHUNK = 200


def clean(text: str) -> str:
    """네이버가 검색어를 감싼 <b> 태그와 &amp; 같은 HTML 엔티티를 지운다."""
    return html.unescape(TAG.sub("", text)).strip()


def to_rows(raw: dict) -> list[dict]:
    """productId 로 중복을 뺀다. 같은 상품이 여러 검색어에 걸리면 먼저 모은 카테고리를 쓴다."""
    rows: dict[str, dict] = {}
    for batch in raw["batches"]:
        for item in batch["items"]:
            product_id = item["productId"]
            if product_id in rows or not item.get("lprice"):
                continue
            path = " > ".join(c for c in (item.get(f"category{i}", "") for i in range(1, 5)) if c)
            rows[product_id] = {
                "id": f"naver-{product_id}",
                "naver_product_id": product_id,
                "title": clean(item["title"]),
                "brand": clean(item.get("brand", "")),
                "maker": clean(item.get("maker", "")),
                "mall_name": clean(item.get("mallName", "")),
                "lprice": int(item["lprice"]),
                "hprice": int(item["hprice"]) if item.get("hprice") else None,
                "image_url": item["image"],
                "link": item["link"],
                "category": batch["category"],
                "naver_category_path": path,
                "seed_keyword": batch["keyword"],
            }
    return list(rows.values())


def auth_headers(key: str) -> dict[str, str]:
    """예전 키(JWT, eyJ…)는 Authorization 에도 넣고, 새 키(sb_secret_…)는 apikey 만 쓴다."""
    headers = {"apikey": key}
    if key.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {key}"
    return headers


def main() -> None:
    if not RAW.exists():
        sys.exit("먼저 scripts/collect_naver.py 를 실행해 주세요")
    rows = to_rows(json.loads(RAW.read_text(encoding="utf-8")))
    print(f"정리한 상품 {len(rows)}개")
    for category, count in Counter(r["category"] for r in rows).most_common():
        print(f"  {category:<5} {count}")
    if "--dry-run" in sys.argv:
        return

    load_dotenv(ROOT / ".env")
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        sys.exit(".env 에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 를 넣어 주세요")

    headers = {**auth_headers(key), "Prefer": "resolution=merge-duplicates,return=minimal"}
    with httpx.Client(base_url=f"{url}/rest/v1", headers=headers, timeout=30) as client:
        for start in range(0, len(rows), CHUNK):
            response = client.post("/products", params={"on_conflict": "id"}, json=rows[start : start + CHUNK])
            if response.is_error:
                sys.exit(f"적재 실패 {response.status_code}: {response.text}")
    print("Supabase 적재 끝")


if __name__ == "__main__":
    main()
