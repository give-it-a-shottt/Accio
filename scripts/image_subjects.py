"""이미지 프롬프트의 상품 묘사 — 피그마 AI(gpt-image-2.5-flare)로 실제 만들 때 쓴 문장 그대로(2026-11-04).

prepare_images.py 의 STYLE 앞부분에 들어간다. 없는 슬러그는 seeds 의 영어 이름을 그대로 쓴다.
같은 흰 튜브로 겹치던 클렌징폼 · 핸드크림은 색 · 거품으로, 실제 제품을 닮았던 무선 이어폰은
'Generic original design' 을 넣어 다시 만들었다.
"""

SUBJECTS: dict[str, str] = {
    "puffer-jacket": "a lightweight quilted puffer jacket (경량 패딩)",
    "wool-coat": "a wool coat on a wooden hanger (울 코트)",
    "knit-sweater": "a neatly folded knit sweater (니트)",
    "sneakers": "a pair of waterproof sneakers (방수 운동화)",
    "hiking-jacket": "a hiking shell jacket (트레킹 자켓)",
    "sunscreen-bottle": "an unlabeled sunscreen tube (선크림)",
    "lip-balm": "a lip balm stick with the cap off (립밤)",
    "facial-cleanser": "a soft mint-green facial foam cleanser tube lying at a slight angle "
    "with a small dollop of white creamy foam beside it (클렌징폼)",
    "hand-cream-tube": "a small pastel pink hand cream tube with a metal-look screw cap, "
    "a little cream squeezed out (핸드크림)",
    "green-grapes": "a bunch of shine muscat green grapes (샤인머스캣)",
    "red-apples": "three fresh red apples grouped together (사과)",
    "meal-kit-ingredients": "an open kraft-paper Korean meal kit box with fresh vegetables, "
    "sliced meat and small sauce cups neatly arranged inside (밀키트)",
    "mixed-nuts": "mixed nuts (almonds, walnuts, cashews) in a small ceramic bowl (견과류)",
    "grilled-chicken-breast": "vacuum-packed cooked chicken breast fillets in clear plastic pouches, "
    "stacked (닭가슴살)",
    "toilet-paper-rolls": "a neat stack of soft white toilet paper rolls (화장지)",
    "laundry-detergent": "a plain unlabeled light-blue liquid laundry detergent bottle "
    "with a handle and measuring cap (세탁세제)",
    "cozy-blanket-bed": "a neatly folded thick, fluffy microfiber blanket in soft beige (극세사 이불)",
    "folded-towels": "a stack of folded cotton bath towels in white and light gray (수건)",
    "reed-diffuser": "an amber glass reed diffuser bottle with rattan sticks (디퓨저)",
    "frying-pan": "a nonstick frying pan with a wooden-look handle (프라이팬)",
    "cooking-pot": "a stainless steel cooking pot with a glass lid (냄비)",
    "food-storage-containers": "a set of three stacked glass food storage containers with locking lids (밀폐용기)",
    "tumbler-cup": "a matte sage-green insulated stainless steel tumbler with a lid and straw (텀블러)",
    "wooden-cutting-board": "a rectangular wooden cutting board with a handle hole (도마)",
    "electric-blanket": "a folded gray electric heated blanket with a small white wired "
    "temperature controller beside it (전기 담요)",
    "space-heater": "a compact white desktop space heater with a front grille (미니 히터)",
    "humidifier": "a minimalist white ultrasonic humidifier with a thin wisp of mist rising from the top (가습기)",
    "cordless-vacuum-cleaner": "a cordless stick vacuum cleaner standing upright (무선 청소기)",
    "air-fryer": "a matte black basket-style air fryer (에어프라이어)",
    "wireless-earbuds": "round pebble-shaped wireless earbuds in matte sand beige, resting beside a flat oval "
    "charging case with a fabric-textured lid (무선 이어폰). Generic original design, not resembling any famous brand",
    "bluetooth-speaker": "a portable fabric-covered cylindrical bluetooth speaker in charcoal (블루투스 스피커)",
    "power-bank": "a slim matte gray power bank with a short USB-C cable (보조배터리). Generic original design",
    "computer-mouse": "an ergonomic wireless computer mouse in off-white (무선 마우스). Generic original design",
    "mechanical-keyboard": "a compact mechanical keyboard with cream and gray keycaps, viewed from a slight top "
    "angle (키보드). Blank keycaps without any letters",
    "camping-lantern": "a rechargeable LED camping lantern with a metal handle, glowing warmly (캠핑 랜턴). "
    "Generic original design",
    "camping-table": "a folding aluminum roll-top camping table with wood-look slats (캠핑 테이블). "
    "Generic original design",
    "camping-cookware": "a stainless steel camping cookware set: nested pots and a small pan with folding "
    "handles (코펠). Generic original design",
    "sleeping-bag": "a rolled-up olive green mummy sleeping bag with compression straps (침낭). "
    "Generic original design",
    "cat-tree": "a multi-level cat tree tower with sisal-wrapped posts, beige plush platforms and a small "
    "cubby house (캣타워). No animals",
    "cat-scratcher": "a curved corrugated cardboard cat scratcher lounge (고양이 스크래쳐). No animals",
    "dog-treats": "dog treats — bone-shaped biscuits and jerky sticks — in a small ceramic pet bowl (강아지 간식). "
    "No animals",
    "dog-lying-on-pad": "a neat stack of folded white quilted pet training pee pads with light blue edges, "
    "one pad partly unfolded on top (배변패드). No animals",
    "cat-litter-box": "a clean light-gray covered cat litter box with a small pile of fine tofu cat litter "
    "granules and a scoop in front (고양이 모래). No animals",
    "baby-wipes": "a soft plain pastel-mint pack of baby wet wipes with a flip-top lid, one wipe pulled out "
    "(아기 물티슈). Unlabeled packaging",
    "baby-lotion": "a soft cream-colored baby lotion pump bottle (유아 로션). Unlabeled packaging",
    "baby-plate-spoon": "a silicone baby feeding set: a divided suction plate, a small bowl and a soft-tip spoon "
    "in muted pastel colors (유아 식기)",
    "toy-blocks": "colorful natural wooden toy building blocks in assorted shapes, a few stacked into a small "
    "tower (블록 장난감). Generic original design, no letters on blocks",
    "baby-clothes": "a neatly folded soft cotton baby long-sleeve pajama set, top and pants, in pale yellow "
    "with tiny dots (유아 내복)",
    "wooden-desk": "a simple oak wooden desk with one slim drawer and tapered legs (책상). Generic original design",
    "storage-cabinet": "a small white wood storage cabinet with two doors and a drawer, light oak top (수납장). "
    "Generic original design",
    "sofa-cushion": "a square sofa throw cushion in textured boucle fabric, oatmeal color (쿠션)",
    "wooden-shelf": "a freestanding three-tier solid wood shelf in natural oak, empty (원목 선반). "
    "Generic original design",
}
