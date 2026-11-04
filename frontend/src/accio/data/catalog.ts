// Accio 리디자인(Figma ACCIO, 2026.10) 목데이터 — 이미지는 assets/v4/img 의 공용 사진을 돌려 쓴다.
import bedding from '../assets/v4/img/bedding.jpg'
import bedroom from '../assets/v4/img/bedroom.jpg'
import campingChair from '../assets/v4/img/camping-chair.jpg'
import campingScene from '../assets/v4/img/camping-scene.jpg'
import campingTable from '../assets/v4/img/camping-table.jpg'
import catHouse from '../assets/v4/img/cat-house.jpg'
import coatModel from '../assets/v4/img/coat-model.jpg'
import coat from '../assets/v4/img/coat.jpg'
import desk from '../assets/v4/img/desk.jpg'
import earbuds from '../assets/v4/img/earbuds.jpg'
import fruit from '../assets/v4/img/fruit.jpg'
import fryingPan from '../assets/v4/img/frying-pan.jpg'
import gift from '../assets/v4/img/gift.jpg'
import kitchen from '../assets/v4/img/kitchen.jpg'
import lantern from '../assets/v4/img/lantern.jpg'
import living from '../assets/v4/img/living.jpg'
import mealkit from '../assets/v4/img/mealkit.jpg'
import moodLamp from '../assets/v4/img/mood-lamp.jpg'
import { accioHref } from '../routes'

// ── 상품 ────────────────────────────────────────────────────────────────

export type Category =
  | '패션'
  | '뷰티'
  | '식품'
  | '생활'
  | '주방'
  | '가전'
  | '디지털'
  | '캠핑'
  | '반려동물'
  | '유아동'
  | '가구'

export interface Product {
  id: string
  brand: string
  name: string
  /** 상세·장바구니처럼 자리가 넉넉한 곳에서 쓰는 긴 상품명 */
  fullName?: string
  /** 할인 전 가격에서 깎인 비율(%). 할인이 없으면 0 */
  discountRate: number
  price: number
  rating: number
  reviewCount: number
  image: string
  category: Category
  /** 'AI 추천' 배지 — AI 개인 추천·검색 결과 맨 앞에 붙인다 */
  aiPick?: boolean
  /** 목록 필터 '배송' 에 걸리는 조건 */
  delivery?: Delivery[]
  soldOut?: boolean
}

export type Delivery = '무료배송' | '오늘 출발' | '내일 도착'
export const DELIVERY_OPTIONS: Delivery[] = ['무료배송', '오늘 출발', '내일 도착']

export const PRODUCTS = {
  winterBedding: { id: 'winter-bedding', brand: '데일리룸', name: '도톰한 극세사 겨울 이불 세트 Q', discountRate: 45, price: 59000, rating: 4.6, reviewCount: 3410, image: bedding, category: '생활', delivery: ['무료배송', '내일 도착'] },
  shineMuscat: { id: 'shine-muscat', brand: '그린테이블', name: '고당도 샤인머스캣 2kg 특품', discountRate: 50, price: 17900, rating: 4.8, reviewCount: 223, image: fruit, category: '식품', delivery: ['오늘 출발'] },
  inductionPan: { id: 'induction-pan', brand: '홈앤쿡', name: '논스틱 인덕션 프라이팬 28cm', discountRate: 38, price: 27500, rating: 4.8, reviewCount: 1522, image: fryingPan, category: '주방', delivery: ['무료배송', '오늘 출발'] },
  ancEarbuds: { id: 'anc-earbuds', brand: '사운드핏', name: '노이즈캔슬링 무선 이어폰 2세대', discountRate: 21, price: 34800, rating: 4.5, reviewCount: 2018, image: earbuds, category: '디지털', aiPick: true, delivery: ['무료배송', '오늘 출발', '내일 도착'] },
  woolLamp: { id: 'wool-lamp', brand: '무드라이트', name: '소프트 램스울 무드 조명 스탠드', discountRate: 18, price: 42900, rating: 4.7, reviewCount: 862, image: moodLamp, category: '가구', delivery: ['무료배송'] },
  campingChair: { id: 'camping-chair', brand: 'Accio', name: '초경량 접이식 캠핑 의자', fullName: '초경량 접이식 캠핑 의자 등받이형', discountRate: 32, price: 39900, rating: 4.8, reviewCount: 1204, image: campingChair, category: '캠핑', aiPick: true, delivery: ['무료배송', '오늘 출발'] },
  campingLantern: { id: 'camping-lantern', brand: '캠프로', name: '무선 충전식 캠핑 랜턴', discountRate: 24, price: 22800, rating: 4.7, reviewCount: 688, image: lantern, category: '캠핑', delivery: ['무료배송', '내일 도착'] },
  electricBlanket: { id: 'electric-blanket', brand: '웜홈', name: '캠핑용 전기 담요 더블', discountRate: 30, price: 45500, rating: 4.6, reviewCount: 412, image: bedding, category: '가전', delivery: ['무료배송'] },
  neckbandEarphone: { id: 'neckband-earphone', brand: '사운드핏', name: '블루투스 넥밴드 이어폰', discountRate: 15, price: 19900, rating: 4.4, reviewCount: 903, image: earbuds, category: '디지털', delivery: ['오늘 출발'] },
  trekkingJacket: { id: 'trekking-jacket', brand: '아웃핏', name: '방수 트레킹 자켓 남녀공용', discountRate: 28, price: 89000, rating: 4.7, reviewCount: 276, image: coat, category: '패션', delivery: ['무료배송'] },
  campingCookware: { id: 'camping-cookware', brand: '홈앤쿡', name: '캠핑 코펠 스테인리스 7종', discountRate: 35, price: 32500, rating: 4.8, reviewCount: 1011, image: fryingPan, category: '주방', delivery: ['무료배송', '오늘 출발'] },
  fleeceZipup: { id: 'fleece-zipup', brand: '모노웨어', name: '플리스 집업 하이넥', discountRate: 20, price: 39000, rating: 4.6, reviewCount: 530, image: coat, category: '패션', delivery: ['내일 도착'] },
  campingTable: { id: 'camping-table', brand: '캠프로', name: '접이식 캠핑 테이블 경량', discountRate: 26, price: 49900, rating: 4.7, reviewCount: 845, image: campingTable, category: '캠핑', delivery: ['무료배송', '오늘 출발'] },
  bluetoothSpeaker: { id: 'bluetooth-speaker', brand: '사운드핏', name: '휴대용 블루투스 스피커', discountRate: 18, price: 29800, rating: 4.5, reviewCount: 667, image: earbuds, category: '가전', delivery: ['무료배송', '내일 도착'] },
  miniHeater: { id: 'mini-heater', brand: '웜홈', name: '미니 전기 히터 저소음', discountRate: 22, price: 29800, rating: 4.6, reviewCount: 1330, image: moodLamp, category: '가전', delivery: ['무료배송', '오늘 출발'] },
  campingMealkit: { id: 'camping-mealkit', brand: '그린테이블', name: '캠핑용 밀키트 4인 세트', discountRate: 12, price: 24900, rating: 4.8, reviewCount: 198, image: mealkit, category: '식품', delivery: ['오늘 출발'] },
  catScratcher: { id: 'cat-scratcher', brand: '펫프렌즈', name: '캣 스크래쳐 하우스', discountRate: 0, price: 31900, rating: 4.9, reviewCount: 742, image: catHouse, category: '반려동물', delivery: ['무료배송'] },
  woolHalfCoat: { id: 'wool-half-coat', brand: '모노웨어', name: '오버핏 울 블렌드 하프 코트', discountRate: 25, price: 129000, rating: 4.7, reviewCount: 318, image: coat, category: '패션', delivery: ['무료배송'] },
  cashmereKnit: { id: 'cashmere-knit', brand: '모노웨어', name: '캐시미어 터치 라운드 니트', discountRate: 20, price: 59000, rating: 4.6, reviewCount: 204, image: coat, category: '패션', delivery: ['무료배송', '내일 도착'] },
  wideSlacks: { id: 'wide-slacks', brand: '모노웨어', name: '와이드 울 슬랙스', discountRate: 15, price: 69000, rating: 4.5, reviewCount: 151, image: coat, category: '패션', delivery: ['무료배송'] },
  // 상품 목록·검색 시안('캠핑 의자' 검색 결과)에 나오는 상품
  relaxChair: { id: 'relax-chair', brand: '캠프로', name: '릴렉스 캠핑 체어 하이백', discountRate: 24, price: 52800, rating: 4.7, reviewCount: 688, image: campingChair, category: '캠핑', delivery: ['무료배송', '내일 도착'] },
  lowChairSet: { id: 'low-chair-set', brand: '아웃핏', name: '알루미늄 로우 체어 2개 세트', discountRate: 18, price: 64000, rating: 4.6, reviewCount: 412, image: campingChair, category: '캠핑', delivery: ['무료배송'] },
  chairCushion: { id: 'chair-cushion', brand: '웜홈', name: '캠핑 의자 방석 겸 담요', discountRate: 30, price: 19900, rating: 4.5, reviewCount: 903, image: campingChair, category: '캠핑', delivery: ['오늘 출발'] },
  rollTableSet: { id: 'roll-table-set', brand: '캠프로', name: '롤 테이블 + 체어 세트', discountRate: 26, price: 89900, rating: 4.7, reviewCount: 276, image: campingTable, category: '캠핑', delivery: ['무료배송', '오늘 출발'] },
  miniStool: { id: 'mini-stool', brand: 'Accio', name: '초경량 스툴 접이식 미니', discountRate: 15, price: 16800, rating: 4.8, reviewCount: 1011, image: campingChair, category: '캠핑', delivery: ['무료배송', '오늘 출발'] },
  woodChair: { id: 'wood-chair', brand: '노마드', name: '빈티지 우드 캠핑 체어', discountRate: 12, price: 78000, rating: 4.6, reviewCount: 530, image: campingChair, category: '캠핑', delivery: ['무료배송'] },
  chairBag: { id: 'chair-bag', brand: '아웃핏', name: '캠핑 의자 수납 가방', discountRate: 20, price: 12900, rating: 4.4, reviewCount: 845, image: campingChair, category: '캠핑', delivery: ['내일 도착'], soldOut: true },
  // 막 입점해 리뷰가 아직 없는 상품 (상태 시안 '상품 상세 · 리뷰 0개')
  chairCover: { id: 'chair-cover', brand: '캠프로', name: '양면 접이식 체어 커버', discountRate: 10, price: 9900, rating: 0, reviewCount: 0, image: campingChair, category: '캠핑', delivery: ['오늘 출발'] },
  // AI 재구매 질문('지난번 산 휴지 또')에 쓰는 생필품
  decoTissue: { id: 'deco-tissue', brand: '데일리룸', name: '3겹 천연펄프 화장지 30롤', discountRate: 20, price: 18900, rating: 4.8, reviewCount: 5120, image: living, category: '생활', delivery: ['무료배송', '오늘 출발'] },
  organicApple: { id: 'organic-apple', brand: '그린테이블', name: '유기농 제철 사과 3kg', discountRate: 10, price: 24900, rating: 4.7, reviewCount: 1840, image: fruit, category: '식품', delivery: ['오늘 출발'] },
  capsuleDetergent: { id: 'capsule-detergent', brand: '데일리룸', name: '캡슐 세탁세제 60입', discountRate: 15, price: 21500, rating: 4.8, reviewCount: 2930, image: living, category: '생활', delivery: ['무료배송', '내일 도착'] },
} satisfies Record<string, Product>

// ── AI 다중검색(김치찌개 재료) — 재료마다 5개, 맨 앞이 판매량 1위 ─────────────────
const grocery = (id: string, name: string, price: number, rating: number, reviewCount: number): Product => ({
  id,
  brand: '그린테이블',
  name,
  discountRate: 0,
  price,
  rating,
  reviewCount,
  image: mealkit,
  category: '식품',
  delivery: ['오늘 출발'],
})

export const KIMCHI_STEW_GROUPS: { label: string; products: Product[] }[] = [
  {
    label: '돼지고기',
    products: [
      grocery('pork-shoulder-600', '한돈 앞다리 찌개용 600g', 12900, 4.8, 2341),
      grocery('pork-neck-500', '국내산 목살 찌개용 500g', 14500, 4.7, 1120),
      grocery('pork-belly-400', '한돈 삼겹 찌개용 400g', 11800, 4.6, 884),
      grocery('pork-shoulder-500', '무항생제 돼지 앞다리 500g', 13200, 4.7, 402),
      grocery('pork-minced-300', '한돈 다짐육 300g', 6900, 4.5, 319),
    ],
  },
  {
    label: '김치',
    products: [
      grocery('aged-kimchi-1kg', '3년 숙성 묵은지 1kg', 9900, 4.9, 3012),
      grocery('napa-kimchi-1kg', '국산 배추김치 1kg', 8900, 4.7, 2210),
      grocery('stew-kimchi-500', '찌개용 썰은 김치 500g', 5900, 4.6, 980),
      grocery('aged-kimchi-2kg', '전라도 묵은지 2kg', 17900, 4.8, 640),
      grocery('vegan-kimchi-1kg', '비건 배추김치 1kg', 10900, 4.5, 211),
    ],
  },
  {
    label: '두부',
    products: [
      grocery('stew-tofu-300', '국산콩 찌개용 두부 300g', 1900, 4.8, 4120),
      grocery('soft-tofu-400', '부침·찌개 겸용 두부 400g', 2300, 4.7, 1530),
      grocery('organic-tofu-300', '유기농 두부 300g', 3200, 4.8, 722),
      grocery('tofu-2pack', '찌개용 두부 2입', 3500, 4.6, 610),
      grocery('silken-tofu-350', '연두부 350g', 1600, 4.5, 288),
    ],
  },
  {
    label: '대파',
    products: [
      grocery('green-onion-1', '흙대파 1단', 2900, 4.7, 2780),
      grocery('green-onion-cut', '손질 대파 300g', 2500, 4.6, 1104),
      grocery('green-onion-frozen', '냉동 썬 대파 500g', 3900, 4.5, 512),
      grocery('small-onion', '쪽파 1단', 3400, 4.6, 330),
      grocery('green-onion-2', '흙대파 2단 묶음', 5300, 4.7, 207),
    ],
  },
  {
    label: '고춧가루',
    products: [
      grocery('chili-powder-100', '국산 고춧가루 100g', 4800, 4.8, 1890),
      grocery('chili-powder-500', '찌개용 고춧가루 500g', 18900, 4.8, 870),
      grocery('chili-powder-fine', '고운 고춧가루 200g', 7900, 4.7, 455),
      grocery('chili-powder-mild', '덜 매운 고춧가루 100g', 4600, 4.5, 260),
      grocery('chili-flakes', '청양 고춧가루 100g', 5200, 4.6, 198),
    ],
  },
]

/** 전체 상품 — 목록·검색·장바구니가 이 안에서 고른다 */
export const ALL_PRODUCTS: Product[] = [...Object.values(PRODUCTS), ...KIMCHI_STEW_GROUPS.flatMap((g) => g.products)]

/** 할인 전 가격 — 할인율로 되돌려 100원 단위로 반올림 */
export const listPriceOf = (product: Product) =>
  product.discountRate > 0 ? Math.round(product.price / (1 - product.discountRate / 100) / 100) * 100 : product.price

/** 목업이라 모든 상품이 같은 상세 화면으로 간다 (id 는 주소에만 남긴다) */
export const productHref = (product: Product) => `${accioHref('/detail')}?id=${product.id}`

// ── 헤더 · 내비게이션 ─────────────────────────────────────────────────────

export const TOP_BANNER = { lead: '첫 구매라면', highlight: '전 상품 10% 쿠폰 받기', href: accioHref('/login') }

export const UTILITY_LINKS = [
  { label: '로그인', href: accioHref('/login') },
  { label: '회원가입', href: accioHref('/signup') },
  { label: '고객센터', href: accioHref('/support') },
  { label: '판매자센터', href: accioHref('/seller') },
]

export const SEARCH_PLACEHOLDER = { pc: '상품명이나 원하는 걸 말로 검색해 보세요', mo: '상품명이나 원하는 걸 말로 검색' }

export const GNB_LINKS = [
  { label: '홈', href: accioHref() },
  { label: '베스트', href: accioHref('/list') },
  { label: '오늘의 특가', href: accioHref('/list') },
  { label: '신상품', href: accioHref('/list') },
  { label: '기획전', href: accioHref('/list') },
  { label: '브랜드관', href: accioHref('/list') },
  { label: '숏폼', href: accioHref('/list') },
]

export const POPULAR_KEYWORDS = ['경량 패딩', '캠핑 의자', '무선 이어폰', '전기 담요', '샤인머스캣']

// ── 홈: AI 히어로 ───────────────────────────────────────────────────────

export const AI_HERO = {
  badge: 'Accio AI 검색',
  title: '찾는 걸 말로 설명해 보세요',
  description: '조건이 많아도 괜찮아요. Accio가 알아서 골라 드려요',
  placeholder: { pc: '캠핑 가서 쓸 가벼운 의자 찾아줘', mo: '예) 자취방에 둘 저렴한 무드등' },
  chips: ['비 오는 날 신을 운동화', '3만원대 집들이 선물', '자취방에 둘 저렴한 무드등', '지난번 산 휴지 또'],
}

// ── 홈: 진행 중인 기획전 ─────────────────────────────────────────────────

export interface EventBanner {
  tag: string
  /** AI 큐레이션처럼 AI 가 고른 기획전이면 태그 앞에 말풍선 점을 붙인다 */
  ai?: boolean
  title: string
  description: string
  /** 모바일은 카드가 좁아 설명을 줄여 쓴다 */
  shortDescription?: string
  image: string
}

export const EVENT_BANNERS: EventBanner[] = [
  { tag: '기획전', title: '아우터 위크', description: '경량 패딩부터 울 코트까지 최대 40%', shortDescription: '최대 40% 할인', image: coatModel },
  { tag: '브랜드데이', title: '홈앤쿡 주방 위크', description: '인기 프라이팬 1+1', image: kitchen },
  { tag: '신규 혜택', title: '첫 구매 10% 쿠폰', description: '가입만 해도 바로 지급', shortDescription: '가입만 해도 지급', image: gift },
  { tag: 'AI 큐레이션', ai: true, title: 'AI가 고른 집들이 선물', description: '3만원대 센스템 모음', image: gift },
  { tag: '시즌', title: '겨울 캠핑 준비', description: '난로·체어·담요 한 번에', image: campingScene },
  { tag: '타임딜', title: '오늘만 이 가격', description: '매일 오전 10시 오픈', image: bedroom },
]

// ── 홈: 빠른 카테고리(모바일) ────────────────────────────────────────────

export const QUICK_CATEGORIES = [
  { label: '베스트', image: moodLamp },
  { label: '특가', image: fryingPan },
  { label: '신상품', image: coat },
  { label: '식품', image: fruit },
  { label: '뷰티', image: gift },
  { label: '패션', image: coat },
  { label: '생활', image: living },
  { label: '가전', image: earbuds },
  { label: '캠핑', image: campingChair },
  { label: '반려동물', image: catHouse },
].map((item) => ({ ...item, href: accioHref('/list') }))

// ── 홈: 오늘의 발견(PC) ─────────────────────────────────────────────────

export const DISCOVERY = {
  title: '오늘의 발견',
  description: 'Accio가 엄선한 지금 가장 HOT한 상품',
  bigTiles: [
    { title: '겨울 이불 끝판왕', description: '도톰한 극세사부터 구스까지', image: bedroom },
    { title: '책상 위 작은 사치', description: '데스크 조명·오거나이저', image: desk },
  ],
  brandTiles: [
    { brand: '그린테이블', description: '제철 과일 산지 직송', image: fruit },
    { brand: '사운드핏', description: '무선 이어폰 최대 30%', image: earbuds },
    { brand: '모노웨어', description: '오버핏 코트 신상', image: coat },
    { brand: '펫프렌즈', description: '캣타워 기획전', image: catHouse },
  ],
}

// ── 홈: 오늘의 특가 ─────────────────────────────────────────────────────

export const TIME_DEAL: Product[] = [
  PRODUCTS.winterBedding,
  PRODUCTS.shineMuscat,
  PRODUCTS.inductionPan,
  PRODUCTS.ancEarbuds,
  PRODUCTS.woolLamp,
  PRODUCTS.campingLantern,
  PRODUCTS.campingTable,
]

// ── 홈: 숏폼 ───────────────────────────────────────────────────────────

export interface Shortform {
  author: string
  views: string
  image: string
  product: Product
  /** 상품 칩에 쓰는 짧은 상품명 — 모바일 칩은 더 좁아서 shortName, PC 는 chipName(없으면 shortName) */
  shortName: string
  chipName?: string
  /** 상품 칩 썸네일이 영상 장면과 다를 때 */
  chipImage?: string
}

export const SHORTFORMS: Shortform[] = [
  { author: '@캠핑하는곰', views: '12.4만회', image: campingScene, product: PRODUCTS.campingChair, shortName: '초경량 캠핑 의자', chipImage: campingChair },
  { author: '@오늘의자취', views: '8.1만회', image: moodLamp, product: PRODUCTS.miniHeater, shortName: '미니 전기 히터' },
  { author: '@모노룩북', views: '21만회', image: coatModel, product: PRODUCTS.woolHalfCoat, shortName: '울 하프 코트', chipName: '울 블렌드 하프 코트', chipImage: coat },
  { author: '@홈쿡일기', views: '5.6만회', image: kitchen, product: PRODUCTS.inductionPan, shortName: '논스틱 프라이팬', chipName: '논스틱 프라이팬 28cm', chipImage: fryingPan },
  { author: '@냥집사', views: '9.9만회', image: catHouse, product: PRODUCTS.catScratcher, shortName: '캣 스크래쳐 하우스' },
  { author: '@책상덕후', views: '3.2만회', image: desk, product: PRODUCTS.woolLamp, shortName: '램스울 무드 조명', chipImage: moodLamp },
  { author: '@겨울잠', views: '7.7만회', image: bedroom, product: PRODUCTS.winterBedding, shortName: '극세사 이불 세트', chipImage: bedding },
  { author: '@집들이요정', views: '4.5만회', image: gift, product: PRODUCTS.shineMuscat, shortName: '샤인머스캣 2kg', chipImage: fruit },
]

// ── 홈: 주목해야 할 브랜드 ───────────────────────────────────────────────

export interface FeaturedBrand {
  name: string
  english: string
  /** PC 배너 제목(두 줄) */
  title: [string, string]
  /** 모바일 배너 제목(두 줄, 짧게) */
  shortTitle: [string, string]
  description: string
  shortDescription: string
  image: string
  products: Product[]
}

export const FEATURED_BRANDS: FeaturedBrand[] = [
  { name: '모노웨어', english: 'MONOWEAR', title: ['겨울을 위한', '가장 단정한 코트'], shortTitle: ['겨울을 위한', '단정한 코트'], description: '신상 울 블렌드 컬렉션 · 최대 25%', shortDescription: '최대 25%', image: coatModel, products: [PRODUCTS.woolHalfCoat, PRODUCTS.cashmereKnit, PRODUCTS.wideSlacks] },
  { name: '그린테이블', english: 'GREEN TABLE', title: ['산지에서 바로,', '제철 과일 한 상'], shortTitle: ['산지에서 바로', '제철 과일'], description: '샤인머스캣·사과 산지 직송 · 최대 50%', shortDescription: '최대 50%', image: fruit, products: [PRODUCTS.shineMuscat, PRODUCTS.campingMealkit] },
  { name: '사운드핏', english: 'SOUNDFIT', title: ['출퇴근길을', '조용하게'], shortTitle: ['출퇴근길을', '조용하게'], description: '노이즈캔슬링 이어폰 · 최대 30%', shortDescription: '최대 30%', image: earbuds, products: [PRODUCTS.ancEarbuds, PRODUCTS.neckbandEarphone, PRODUCTS.bluetoothSpeaker] },
  { name: '홈앤쿡', english: 'HOME & COOK', title: ['매일 쓰는 팬,', '오래 쓰는 팬'], shortTitle: ['매일 쓰는', '오래 쓰는 팬'], description: '인기 프라이팬 1+1 · 주방 위크', shortDescription: '1+1 주방 위크', image: kitchen, products: [PRODUCTS.inductionPan, PRODUCTS.campingCookware] },
  { name: '무드라이트', english: 'MOODLIGHT', title: ['긴 겨울밤엔', '은은한 조명 하나'], shortTitle: ['긴 겨울밤', '은은한 조명'], description: '램스울 스탠드 신상 · 최대 18%', shortDescription: '최대 18%', image: moodLamp, products: [PRODUCTS.woolLamp, PRODUCTS.miniHeater] },
  { name: '펫프렌즈', english: 'PET FRIENDS', title: ['고양이가 먼저', '골라 들어가는 집'], shortTitle: ['고양이가', '고른 집'], description: '스크래쳐·캣타워 기획전', shortDescription: '캣타워 기획전', image: catHouse, products: [PRODUCTS.catScratcher] },
  { name: '데일리룸', english: 'DAILY ROOM', title: ['포근한 겨울잠을', '위한 침구'], shortTitle: ['포근한', '겨울 침구'], description: '극세사 이불 세트 · 최대 45%', shortDescription: '최대 45%', image: bedroom, products: [PRODUCTS.winterBedding, PRODUCTS.electricBlanket] },
]

// ── 홈: 에디터 픽(PC) ───────────────────────────────────────────────────

export const EDITOR_PICKS = [
  { title: ['첫 겨울 캠핑,', '이것만 챙기세요'], description: '가볍고 따뜻한 장비만 골랐어요. 의자부터 난로까지 한 번에.', products: [PRODUCTS.campingChair, PRODUCTS.campingLantern, PRODUCTS.electricBlanket] },
  { title: ['자취방 겨울,', '이렇게 따뜻하게'], description: '좁은 방에도 부담 없는 크기와 전기료만 골랐어요.', products: [PRODUCTS.miniHeater, PRODUCTS.winterBedding, PRODUCTS.woolLamp] },
]

// ── 홈: AI 개인 추천 ────────────────────────────────────────────────────

export const RECOMMEND = {
  label: 'ACCIO AI 개인 추천',
  title: '회원님 취향에 맞춰 골랐어요',
  recentKeywords: ['캠핑 의자', '무선 이어폰'],
}

export const RECOMMEND_CATEGORIES: { label: '전체' | Category; image?: string }[] = [
  { label: '전체' },
  { label: '패션', image: coat },
  { label: '뷰티', image: gift },
  { label: '식품', image: fruit },
  { label: '생활', image: living },
  { label: '주방', image: fryingPan },
  { label: '가전', image: earbuds },
  { label: '디지털', image: earbuds },
  { label: '캠핑', image: campingChair },
  { label: '반려동물', image: catHouse },
  { label: '유아동', image: bedding },
  { label: '가구', image: campingTable },
]

export const RECOMMENDED: Product[] = [
  PRODUCTS.campingChair,
  PRODUCTS.ancEarbuds,
  PRODUCTS.campingLantern,
  PRODUCTS.electricBlanket,
  PRODUCTS.neckbandEarphone,
  PRODUCTS.trekkingJacket,
  PRODUCTS.campingCookware,
  PRODUCTS.fleeceZipup,
  PRODUCTS.campingTable,
  PRODUCTS.bluetoothSpeaker,
  PRODUCTS.miniHeater,
  PRODUCTS.campingMealkit,
  PRODUCTS.winterBedding,
  PRODUCTS.shineMuscat,
  PRODUCTS.inductionPan,
  PRODUCTS.woolLamp,
  PRODUCTS.catScratcher,
  PRODUCTS.woolHalfCoat,
  PRODUCTS.cashmereKnit,
  PRODUCTS.wideSlacks,
]

// ── 푸터 ───────────────────────────────────────────────────────────────

export const FOOTER = {
  phone: '1577-0000',
  hours: ['평일 09:00 – 18:00 · 점심 12:00 – 13:00', '주말·공휴일 휴무'],
  columns: [
    { title: '쇼핑', links: ['베스트', '오늘의 특가', '신상품', '기획전', '숏폼'] },
    { title: '내 정보', links: ['주문내역', '취소·반품', '찜', '최근 본 상품', '내 리뷰'] },
    { title: 'Accio', links: ['회사 소개', '판매자 입점', 'AI 검색 안내', '공지사항'] },
  ],
  policies: ['이용약관', '개인정보처리방침', '청소년보호정책', '입점 문의'],
  company: '(주)액시오 · 대표 홍길동 · 사업자등록번호 000-00-00000 · 통신판매업 0000-서울-0000',
  address: '서울특별시 어딘가로 123 · 개인 포트폴리오 프로젝트로, 실제 판매가 이루어지지 않습니다.',
}
