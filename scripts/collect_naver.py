"""네이버 쇼핑 검색 API 로 상품을 모아 scripts/data/naver_raw.json 에 저장한다.

    uv run python scripts/collect_naver.py

필요한 값(.env): NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
호출 수: 키워드 55개 × 1번 = 55번 (하루 한도 25,000번)
"""

import json
import os
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

import httpx
from dotenv import load_dotenv

from seeds import PER_KEYWORD, SEEDS

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "scripts" / "data" / "naver_raw.json"
URL = "https://openapi.naver.com/v1/search/shop.json"
# 중고 · 렌탈 · 해외직구는 뺀다 — 가격 · 배송 조건이 일반 상품과 달라 검색 결과가 헷갈린다
EXCLUDE = "used:rental:cbshop"
# 연달아 부르면 초당 한도에 걸릴 수 있어 살짝 쉰다
GAP_SECONDS = 0.15


def main() -> None:
    load_dotenv(ROOT / ".env")
    client_id = os.getenv("NAVER_CLIENT_ID")
    client_secret = os.getenv("NAVER_CLIENT_SECRET")
    if not client_id or not client_secret:
        sys.exit(".env 에 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 를 넣어 주세요")

    headers = {"X-Naver-Client-Id": client_id, "X-Naver-Client-Secret": client_secret}
    batches = []
    with httpx.Client(headers=headers, timeout=10) as client:
        for category, keywords in SEEDS.items():
            for keyword in keywords:
                params = {"query": keyword, "display": PER_KEYWORD, "start": 1, "sort": "sim", "exclude": EXCLUDE}
                response = client.get(URL, params=params)
                response.raise_for_status()
                items = response.json()["items"]
                batches.append({"category": category, "keyword": keyword, "items": items})
                print(f"{category:<5} {keyword:<10} {len(items)}개")
                time.sleep(GAP_SECONDS)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {"collected_at": datetime.now(UTC).isoformat(), "batches": batches}
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    total = sum(len(b["items"]) for b in batches)
    print(f"\n저장: {OUT.relative_to(ROOT)} — 검색어 {len(batches)}개, 상품 {total}개(중복 포함)")


if __name__ == "__main__":
    main()
