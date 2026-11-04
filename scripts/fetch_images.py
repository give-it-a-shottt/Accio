"""Unsplash 에서 키워드마다 사진을 골라 data/images.json 에 저장한다(사진 주소 + 작가 출처만).

    uv run python scripts/fetch_images.py          빠진 것만 이어서 한다
    uv run python scripts/fetch_images.py --all    검색부터 전부 다시 한다

필요한 값(.env): UNSPLASH_ACCESS_KEY (unsplash.com/developers 에서 앱을 만들면 나오는 Access Key)

Unsplash API 가이드에 맞춘 것
- 사진은 다시 올리지 않고 Unsplash 주소(images.unsplash.com)를 그대로 쓴다. 크기만 주소 뒤 값으로 바꾸고 ixid 는 남긴다
- 화면에 작가 이름과 Unsplash 를 링크(utm_source · utm_medium 포함)로 표시한다 — 그래서 링크를 함께 저장한다
- 앱에서 사진을 '쓰면' download_location 을 한 번 불러 알린다. 상품에 붙이는 사진은 모두 쓰는 것이므로 전부 알린다

호출 수: 검색 55번 + 사용 알림 550번. 데모 모드는 시간당 50번이라 한도가 차면 다음 시간까지 기다렸다가
이어서 한다(전부 끝나는 데 반나절쯤). 사진 주소 자체(이미지 파일)는 한도에 들어가지 않는다.
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
API = "https://api.unsplash.com"
UTM = "utm_source=accio&utm_medium=referral"
# 카드 · 상세에 쓰는 정사각형 크기. raw 주소에 붙이면 Unsplash 가 잘라서 보내 준다(ixid 는 raw 에 들어 있다)
SIZE = "&w=800&h=800&fit=crop&crop=entropy&auto=format&q=75"
WAIT_SECONDS = 5 * 60


def with_utm(url: str) -> str:
    return f"{url}{'&' if '?' in url else '?'}{UTM}"


def call(client: httpx.Client, path: str, params: dict | None = None) -> httpx.Response:
    """한도(시간당 50번)에 걸리면 기다렸다가 다시 부른다."""
    while True:
        response = client.get(path, params=params)
        limited = response.status_code == 429 or (
            response.status_code == 403 and "Rate Limit" in response.text
        )
        if not limited:
            response.raise_for_status()
            return response
        print(f"  시간당 한도 — {WAIT_SECONDS // 60}분 기다렸다가 이어서 해요")
        time.sleep(WAIT_SECONDS)


def save(saved: dict) -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(saved, ensure_ascii=False, indent=1), encoding="utf-8")


def main() -> None:
    load_dotenv(ROOT / ".env")
    access_key = os.getenv("UNSPLASH_ACCESS_KEY")
    if not access_key:
        sys.exit(".env 에 UNSPLASH_ACCESS_KEY 를 넣어 주세요")

    saved: dict[str, list[dict]] = {}
    if OUT.exists() and "--all" not in sys.argv:
        saved = json.loads(OUT.read_text(encoding="utf-8"))

    headers = {"Authorization": f"Client-ID {access_key}", "Accept-Version": "v1"}
    with httpx.Client(base_url=API, headers=headers, timeout=15) as client:
        # 1) 키워드마다 사진 검색
        for keywords in SEEDS.values():
            for keyword, query in keywords:
                if keyword in saved:
                    continue
                params = {"query": query, "per_page": PHOTOS_PER_KEYWORD, "orientation": "squarish",
                          "content_filter": "high"}
                response = call(client, "/search/photos", params)
                saved[keyword] = [
                    {
                        "id": photo["id"],
                        "src": photo["urls"]["raw"] + SIZE,
                        "alt": photo.get("alt_description") or keyword,
                        "photographer": photo["user"]["name"],
                        "photographer_url": with_utm(photo["user"]["links"]["html"]),
                        "page_url": with_utm(photo["links"]["html"]),
                        "download_location": photo["links"]["download_location"],
                        "tracked": False,
                    }
                    for photo in response.json()["results"]
                ]
                save(saved)
                left = response.headers.get("X-Ratelimit-Remaining", "?")
                print(f"{keyword:<10} {query:<26} {len(saved[keyword])}장 (남은 한도 {left})")

        # 2) 상품에 붙일 사진을 '썼다'고 Unsplash 에 알린다
        pending = [p for photos in saved.values() for p in photos if not p["tracked"]]
        print(f"\n사용 알림 {len(pending)}건")
        for index, photo in enumerate(pending, 1):
            call(client, photo["download_location"].removeprefix(API))
            photo["tracked"] = True
            if index % 10 == 0 or index == len(pending):
                save(saved)
                print(f"  {index}/{len(pending)}")

    save(saved)
    print(f"\n{OUT.relative_to(ROOT)} — 키워드 {len(saved)}개, 사진 {sum(len(v) for v in saved.values())}장")


if __name__ == "__main__":
    main()
