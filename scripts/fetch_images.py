"""Pexels 에서 키워드마다 사진을 받아 data/images.json 에 저장한다(사진 주소 + 작가 출처만).

    uv run python scripts/fetch_images.py          빠진 키워드만 받는다
    uv run python scripts/fetch_images.py --all    전부 다시 받는다

필요한 값(.env): PEXELS_API_KEY
호출 수: 키워드 55개 × 1번 = 55번 (무료 한도 시간당 200번 · 월 20,000번)
Pexels 가이드: 'Photos provided by Pexels' 표시, 가능하면 작가 이름과 사진 페이지 링크를 함께 보여 준다.
"""

import json
import os
import sys
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv

from seeds import PHOTOS_PER_KEYWORD, SEEDS

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "images.json"
URL = "https://api.pexels.com/v1/search"
GAP_SECONDS = 0.5


def main() -> None:
    load_dotenv(ROOT / ".env")
    api_key = os.getenv("PEXELS_API_KEY")
    if not api_key:
        sys.exit(".env 에 PEXELS_API_KEY 를 넣어 주세요")

    saved: dict[str, list[dict]] = {}
    if OUT.exists() and "--all" not in sys.argv:
        saved = json.loads(OUT.read_text(encoding="utf-8"))

    with httpx.Client(headers={"Authorization": api_key}, timeout=15) as client:
        for keywords in SEEDS.values():
            for keyword, query in keywords:
                if keyword in saved:
                    continue
                params = {"query": query, "per_page": PHOTOS_PER_KEYWORD, "orientation": "square"}
                response = client.get(URL, params=params)
                response.raise_for_status()
                photos = [
                    {
                        "id": photo["id"],
                        # 카드 · 상세에 쓰는 크기. large 는 가로 940px 안팎
                        "src": photo["src"]["large"],
                        "alt": photo.get("alt") or keyword,
                        "photographer": photo["photographer"],
                        "photographer_url": photo["photographer_url"],
                        "page_url": photo["url"],
                    }
                    for photo in response.json()["photos"]
                ]
                saved[keyword] = photos
                left = response.headers.get("X-Ratelimit-Remaining", "?")
                print(f"{keyword:<10} {query:<26} {len(photos)}장 (남은 한도 {left})")
                time.sleep(GAP_SECONDS)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(saved, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n{OUT.relative_to(ROOT)} — 키워드 {len(saved)}개, 사진 {sum(len(v) for v in saved.values())}장")


if __name__ == "__main__":
    main()
