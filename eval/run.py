"""검색 채점기 — eval/queries.json 의 검색어를 검색 API 로 돌려 상위 5개가 조건을 지키는 비율을 잰다.

    uv run python eval/run.py --check            데이터에 정답이 5개 이상 있는지(시험지가 풀 수 있는 문제인지)
    uv run python eval/run.py                    점수 보기 (runs/S0.json 이 있으면 그것과 비교)
    uv run python eval/run.py --save S0          점수를 runs/S0.json 에 남기기
    uv run python eval/run.py --base S1          비교 기준 바꾸기
    uv run python eval/run.py --api http://…     다른 서버(배포 주소 등)로 재기
    uv run python eval/run.py --mode keyword     Gemini 해석 없이(S0 과 같은 조건). 기본은 auto
    uv run python eval/run.py --gap 4            검색어 사이를 4초 띄우기(Gemini 무료 분당 한도)

점수: 검색어마다 precision@5 = 상위 5개 중 조건을 모두 지킨 개수 / 5 (결과가 5개보다 적으면 모자란 만큼 틀림).
데이터에 정답이 5개보다 적은 검색어는 분모를 그 수로 줄인다(있는 정답을 다 찾으면 만점).
전체 점수는 그 평균. type(plain · attribute · price · exclude · situation)별로도 본다.
"""

import json
import sys
import time
from collections import defaultdict
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parent.parent
QUERIES = ROOT / "eval" / "queries.json"
RUNS = ROOT / "eval" / "runs"
PRODUCTS = ROOT / "data" / "products.json"
TOP_K = 5


def option(name: str, default: str | None = None) -> str | None:
    return sys.argv[sys.argv.index(f"--{name}") + 1] if f"--{name}" in sys.argv else default


def text_of(product: dict) -> str:
    """조건 검사에 쓰는 글 — 상품명 + 태그 (검색 API 가 주는 값만으로 판단한다)."""
    return " ".join([product["name"], *product.get("tags", [])]).lower()


def failures(product: dict, q: dict) -> list[str]:
    """이 상품이 지키지 못한 조건 이름들. 비어 있으면 정답."""
    reasons = []
    if "keywords" in q and product.get("keyword") not in q["keywords"]:
        reasons.append("종류")
    if "category" in q and product.get("category") != q["category"]:
        reasons.append("카테고리")
    if "price_min" in q and product["price"] < q["price_min"]:
        reasons.append("가격")
    if "price_max" in q and product["price"] > q["price_max"]:
        reasons.append("가격")
    text = text_of(product)
    if "require_any" in q and not any(word.lower() in text for word in q["require_any"]):
        reasons.append("특징")
    if "exclude" in q and any(word.lower() in text for word in q["exclude"]):
        reasons.append("제외어")
    return reasons


def check(queries: list[dict]) -> None:
    """생성 데이터 전체에서 조건을 지키는 상품 수 — 5개 미만이면 시험지를 고쳐야 한다."""
    data = json.loads(PRODUCTS.read_text(encoding="utf-8"))
    products = [{**p, "keyword": kw} for kw, items in data.items() for p in items]
    bad = 0
    for q in queries:
        n = sum(1 for p in products if not failures(p, q))
        flag = "" if n >= TOP_K else "  ⚠ 정답이 5개보다 적음"
        bad += n < TOP_K
        print(f"{q['id']} {q['query']:<24} 정답 {n:>3}개{flag}")
    print(f"\n풀 수 없는 문제 {bad}개")


def achievable(queries: list[dict]) -> dict[str, int]:
    """검색어마다 데이터 전체에서 조건을 지키는 상품 수(최대 5) — 점수의 분모."""
    data = json.loads(PRODUCTS.read_text(encoding="utf-8"))
    products = [{**p, "keyword": kw} for kw, items in data.items() for p in items]
    return {q["id"]: min(TOP_K, sum(1 for p in products if not failures(p, q))) for q in queries}


def run(queries: list[dict], api: str, mode: str, gap: float) -> dict:
    ideal = achievable(queries)
    results = []
    with httpx.Client(base_url=api.rstrip("/"), timeout=30) as client:
        for q in queries:
            started = time.perf_counter()
            response = client.get("/api/search", params={"q": q["query"], "limit": TOP_K, "mode": mode})
            response.raise_for_status()
            elapsed = round((time.perf_counter() - started) * 1000)
            body = response.json()
            top = body["products"][:TOP_K]
            judged = [{"id": p["id"], "name": p["name"], "keyword": p.get("keyword"), "price": p["price"],
                       "fail": failures(p, q)} for p in top]
            hits = sum(1 for j in judged if not j["fail"])
            results.append({
                "id": q["id"], "type": q["type"], "query": q["query"],
                "precision": min(1.0, hits / max(1, ideal[q["id"]])),
                "first_hit": bool(judged) and not judged[0]["fail"], "ms": elapsed, "top": judged,
                "mode": body.get("mode"), "fallback": body.get("fallbackReason"),
                "interpreted": body.get("interpreted"),
            })
            if gap:
                time.sleep(gap)
    by_type: dict[str, list[float]] = defaultdict(list)
    for r in results:
        by_type[r["type"]].append(r["precision"])
    return {
        "fallbacks": sum(1 for r in results if r["fallback"]),
        "precision_at_5": round(sum(r["precision"] for r in results) / len(results), 3),
        "first_hit_rate": round(sum(r["first_hit"] for r in results) / len(results), 3),
        "median_ms": sorted(r["ms"] for r in results)[len(results) // 2],
        "by_type": {t: round(sum(v) / len(v), 3) for t, v in sorted(by_type.items())},
        "results": results,
    }


def report(score: dict, base: dict | None, base_name: str) -> None:
    previous = {r["id"]: r for r in base["results"]} if base else {}
    print(f"{'id':<4} {'P@5':>4} {'Δ':>5}  검색어 → 틀린 이유(상위 5개)")
    for r in score["results"]:
        delta = ""
        if r["id"] in previous:
            d = r["precision"] - previous[r["id"]]["precision"]
            delta = f"{d:+.1f}" if d else "·"
        reasons = sorted({reason for j in r["top"] for reason in j["fail"]})
        missing = TOP_K - len(r["top"])
        why = ", ".join(reasons) + (f", 결과 {missing}개 모자람" if missing else "")
        print(f"{r['id']:<4} {r['precision']:>4.1f} {delta:>5}  {r['query']}" + (f" → {why}" if why else ""))
    print()
    line = (f"precision@5 {score['precision_at_5']:.3f} · 1위 정답률 {score['first_hit_rate']:.3f}"
            f" · 응답 중앙값 {score['median_ms']}ms")
    if base:
        change = score["precision_at_5"] - base["precision_at_5"]
        line += f"   ({base_name}: {base['precision_at_5']:.3f} → {change:+.3f})"
    print(line)
    print("유형별: " + " · ".join(f"{t} {v:.2f}" for t, v in score["by_type"].items()))
    if score.get("fallbacks"):
        print(f"⚠ Gemini 해석 실패로 키워드 검색으로 돌아간 문항 {score['fallbacks']}개")


def main() -> None:
    queries = json.loads(QUERIES.read_text(encoding="utf-8"))["queries"]
    if "--check" in sys.argv:
        check(queries)
        return
    score = run(queries, option("api", "http://localhost:8000"), option("mode", "auto"), float(option("gap", "0")))
    base_name = option("base", "S0")
    base_path = RUNS / f"{base_name}.json"
    save_as = option("save")
    base = json.loads(base_path.read_text(encoding="utf-8")) if base_path.exists() and save_as != base_name else None
    report(score, base, base_name)
    if save_as:
        RUNS.mkdir(parents=True, exist_ok=True)
        (RUNS / f"{save_as}.json").write_text(json.dumps(score, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"\n저장: eval/runs/{save_as}.json")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
