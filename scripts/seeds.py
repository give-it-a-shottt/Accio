"""상품 생성 키워드 — 카테고리 11개 × 세부 키워드 5개 × 키워드당 20개 = 1,100개.

카테고리는 프론트 `Category` 타입(frontend/src/accio/data/catalog.ts)과 같은 이름이어야 필터 UI 와 맞는다.
키워드는 목 데이터 상품 · 홈 추천 질문(비 오는 날 운동화, 집들이 선물, 자취방 무드등, 휴지)에서 골랐다.
한 키워드로 한 카테고리를 다 채우면 결과가 한쪽으로 쏠려서(예: '캠핑' → 텐트만) 세부 키워드로 나눈다.
두 번째 값은 Pexels 사진 검색어 — Pexels 는 영어 검색어가 훨씬 잘 맞는다.
"""

SEEDS: dict[str, list[tuple[str, str]]] = {
    "패션": [
        ("경량 패딩", "puffer jacket"),
        ("울 코트", "wool coat"),
        ("니트", "knit sweater"),
        ("방수 운동화", "sneakers"),
        ("트레킹 자켓", "hiking jacket"),
    ],
    "뷰티": [
        ("수분크림", "face cream jar"),
        ("선크림", "sunscreen bottle"),
        ("립밤", "lip balm"),
        ("클렌징폼", "facial cleanser"),
        ("핸드크림", "hand cream tube"),
    ],
    "식품": [
        ("샤인머스캣", "green grapes"),
        ("사과", "red apples"),
        ("밀키트", "meal kit ingredients"),
        ("견과류", "mixed nuts"),
        ("닭가슴살", "grilled chicken breast"),
    ],
    "생활": [
        ("화장지", "toilet paper rolls"),
        ("세탁세제", "laundry detergent"),
        ("극세사 이불", "cozy blanket bed"),
        ("수건", "folded towels"),
        ("디퓨저", "reed diffuser"),
    ],
    "주방": [
        ("프라이팬", "frying pan"),
        ("냄비 세트", "cooking pot"),
        ("밀폐용기", "food storage containers"),
        ("텀블러", "tumbler cup"),
        ("도마", "wooden cutting board"),
    ],
    "가전": [
        ("전기 담요", "electric blanket"),
        ("미니 히터", "space heater"),
        ("가습기", "humidifier"),
        ("무선 청소기", "cordless vacuum cleaner"),
        ("에어프라이어", "air fryer"),
    ],
    "디지털": [
        ("무선 이어폰", "wireless earbuds"),
        ("블루투스 스피커", "bluetooth speaker"),
        ("보조배터리", "power bank"),
        ("무선 마우스", "computer mouse"),
        ("키보드", "mechanical keyboard"),
    ],
    "캠핑": [
        ("캠핑 의자", "camping chair"),
        ("캠핑 랜턴", "camping lantern"),
        ("캠핑 테이블", "camping table"),
        ("코펠", "camping cookware"),
        ("침낭", "sleeping bag"),
    ],
    "반려동물": [
        ("캣타워", "cat tree"),
        ("고양이 스크래쳐", "cat scratcher"),
        ("강아지 간식", "dog treats"),
        ("배변패드", "dog lying on pad"),
        ("고양이 모래", "cat litter box"),
    ],
    "유아동": [
        ("아기 물티슈", "baby wipes"),
        ("유아 로션", "baby lotion"),
        ("유아 식기", "baby plate spoon"),
        ("블록 장난감", "toy blocks"),
        ("유아 내복", "baby clothes"),
    ],
    "가구": [
        ("무드등", "table lamp"),
        ("책상", "wooden desk"),
        ("수납장", "storage cabinet"),
        ("쿠션", "sofa cushion"),
        ("원목 선반", "wooden shelf"),
    ],
}

# 키워드마다 만들 상품 수 → 카테고리당 100개, 전체 1,100개
PER_KEYWORD = 20
# 키워드마다 받을 사진 수 — 같은 키워드 상품 20개가 사진 10장을 2번씩 나눠 쓴다
PHOTOS_PER_KEYWORD = 10
