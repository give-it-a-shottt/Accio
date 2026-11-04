"""상품 이미지 준비 — 프롬프트 목록 만들기 + 받은 이미지를 webp 로 줄여 상품과 잇기.

    uv run python scripts/prepare_images.py prompts   data/image_prompts.md 에 키워드별 프롬프트 55개를 쓴다
    uv run python scripts/prepare_images.py build     scripts/images_in/ 의 이미지를 줄여
                                                      frontend/public/products/ 에 넣고 data/images.json 을 쓴다

지금 이미지는 피그마 AI(gpt-image-2.5-flare)로 만들었다(2026-11-04, 키워드당 1장).
구글 플로우 등 어디서 만들어도 된다. 파일 이름만 규칙대로:
    scripts/images_in/{슬러그}-1.png, {슬러그}-2.jpg …   (슬러그 예: camping-chair, table-lamp)
키워드마다 1장 이상. 같은 키워드 상품 20개가 그 사진들을 돌려 쓴다(목 데이터도 사진을 나눠 쓴다).
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

from image_subjects import SUBJECTS, VARIANTS
from seeds import SEEDS

ROOT = Path(__file__).resolve().parent.parent
IN_DIR = ROOT / "scripts" / "images_in"
OUT_DIR = ROOT / "frontend" / "public" / "products"
IMAGES = ROOT / "data" / "images.json"
PROMPTS = ROOT / "data" / "image_prompts.md"
SIZE = 800
EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}

# 모든 사진이 한 쇼핑몰 카탈로그처럼 보이도록 톤을 하나로 고정한다. 지어낸 브랜드라 글자 · 로고는 넣지 않는다.
STYLE = (
    "Studio e-commerce product photo of {subject}. One product, centered, fills about 70% of the frame. "
    "Soft natural daylight from the left, gentle shadow, light warm-gray seamless background, "
    "minimal and clean, realistic materials. No text, no logos, no brand names, no watermark, no people. "
    "Square 1:1."
)


def slug(query: str) -> str:
    return query.replace(" ", "-")


def write_prompts() -> None:
    lines = [
        "# 상품 이미지 프롬프트 (키워드 55개 × 3장)",
        "",
        "구글 플로우 · 피그마 AI 등에 그대로 붙여 넣고 `scripts/images_in/{파일 이름}` 으로 저장한다.",
        "다 넣은 뒤 `uv run python scripts/prepare_images.py build`.",
        "실제 생성 때는 전자 · 가구에 'Generic original design.', 반려동물에 'no animals' 를 덧붙였다.",
        "",
    ]
    count = 0
    for category, keywords in SEEDS.items():
        lines.append(f"## {category}")
        lines.append("")
        for keyword, query in keywords:
            subjects = [SUBJECTS.get(slug(query), f"{query} ({keyword})"), *VARIANTS.get(slug(query), [])]
            for index, subject in enumerate(subjects, 1):
                lines.append(f"### {keyword} → `{slug(query)}-{index}.png`")
                lines.append("")
                lines.append("```")
                lines.append(STYLE.format(subject=subject))
                lines.append("```")
                lines.append("")
                count += 1
    PROMPTS.parent.mkdir(parents=True, exist_ok=True)
    PROMPTS.write_text("\n".join(lines), encoding="utf-8")
    print(f"{PROMPTS.relative_to(ROOT)} — 프롬프트 {count}개")


def build() -> None:
    files = sorted(p for p in IN_DIR.glob("*") if p.suffix.lower() in EXTENSIONS) if IN_DIR.exists() else []
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    images: dict[str, list[dict]] = {}
    missing = []
    for keywords in SEEDS.values():
        for keyword, query in keywords:
            name = slug(query)
            sources = [p for p in files if p.stem == name or p.stem.startswith(f"{name}-")]
            if not sources:
                missing.append(f"{keyword}({name})")
                continue
            images[keyword] = []
            for index, source in enumerate(sources, 1):
                target = OUT_DIR / f"{name}-{index}.webp"
                with Image.open(source) as image:
                    # 가운데를 정사각형으로 잘라 800px 로 — 카드 · 상세 모두 정사각형 자리에 들어간다
                    square = ImageOps.fit(ImageOps.exif_transpose(image).convert("RGB"), (SIZE, SIZE))
                    square.save(target, "WEBP", quality=80, method=6)
                images[keyword].append({"src": f"/products/{target.name}", "alt": f"{keyword} 상품 이미지"})

    IMAGES.write_text(json.dumps(images, ensure_ascii=False, indent=1), encoding="utf-8")
    total = sum(len(v) for v in images.values())
    size_kb = sum(p.stat().st_size for p in OUT_DIR.glob("*.webp")) // 1024
    print(f"이미지 {total}장 → {OUT_DIR.relative_to(ROOT)} ({size_kb}KB), {IMAGES.relative_to(ROOT)}")
    if missing:
        print(f"아직 없는 키워드 {len(missing)}개: {', '.join(missing)}")


if __name__ == "__main__":
    # Windows 터미널(cp949)에서도 한글 · 기호 출력이 깨지거나 멈추지 않게
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    command = sys.argv[1] if len(sys.argv) > 1 else ""
    if command == "prompts":
        write_prompts()
    elif command == "build":
        build()
    else:
        sys.exit(__doc__)
