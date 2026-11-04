// 판매자센터 목업 데이터 — 시안(캠프로 스토어)의 상품·주문·클레임. 브라우저에 저장해 처리 결과가 남는다.
import bedding from '../assets/v4/img/bedding.jpg'
import campingChairImg from '../assets/v4/img/camping-chair.jpg'
import campingTableImg from '../assets/v4/img/camping-table.jpg'
import lanternImg from '../assets/v4/img/lantern.jpg'
import moodLamp from '../assets/v4/img/mood-lamp.jpg'
import createStore from '../ui/createStore'

// 저장소에는 빌드마다 바뀌는 이미지 주소 대신 이름만 남기고, 그릴 때 주소로 바꾼다
export const SELLER_IMAGES = { chair: campingChairImg, table: campingTableImg, lantern: lanternImg, lamp: moodLamp, bedding } as const
export type SellerImage = keyof typeof SELLER_IMAGES
/** 이름이면 사진 주소로, 방금 올린 사진(blob:)이면 그대로 */
export const sellerImage = (image: string) => SELLER_IMAGES[image as SellerImage] ?? (image.startsWith('blob:') ? image : campingChairImg)
const campingChair = 'chair'
const campingTable = 'table'
const lantern = 'lantern'

export interface SellerProfile {
  /** 판매자로 등록한 회원 이메일 — 예전 기록엔 없어서 없으면 예시 계정으로 본다 */
  email?: string
  storeName: string
  owner: string
  bizNo: string
  phone: string
  shipping: string
  bank?: string
  account?: string
}

export type SellerProductStatus = '판매중' | '품절' | '숨김'

export interface SellerProduct {
  no: number
  name: string
  category: string
  price: number
  stock: number
  hidden?: boolean
  image: string
}

export const productStatus = (p: SellerProduct): SellerProductStatus => (p.hidden ? '숨김' : p.stock === 0 ? '품절' : '판매중')

export type SellerOrderStatus = '결제완료' | '배송준비' | '배송중' | '배송완료'

export interface SellerOrder {
  no: string
  item: string
  buyer: string
  amount: number
  status: SellerOrderStatus
  /** 송장 번호 — 없으면 미등록 */
  invoice?: string
  /** AI 가 이상하다고 본 주문 */
  suspicious?: string
}

export interface SellerClaim {
  id: string
  type: '반품' | '취소'
  priority: '높음' | '보통'
  date: string
  orderNo: string
  product: string
  reason: string
  quote: string
  photos: number
  refund: number
  analysis: { fault: string; mood: string; urgency: string; action: string }
  result?: '반품 승인' | '교환 제안' | '거절'
}

const SEED_PRODUCTS: SellerProduct[] = [
  { no: 102310, name: '릴렉스 캠핑 체어 하이백', category: '캠핑 의자', price: 52800, stock: 18, image: campingChair },
  { no: 102311, name: '무선 충전식 캠핑 랜턴', category: '캠핑 소품', price: 22800, stock: 204, image: lantern },
  { no: 102312, name: '접이식 캠핑 테이블 경량', category: '캠핑 테이블', price: 49900, stock: 0, image: campingTable },
  { no: 102313, name: '롤 테이블 + 체어 세트', category: '캠핑 테이블', price: 89900, stock: 36, image: campingTable },
  { no: 102314, name: '양면 접이식 체어 커버', category: '캠핑 소품', price: 9900, stock: 512, hidden: true, image: campingChair },
  { no: 102315, name: '캠핑 의자 수납 가방', category: '캠핑 소품', price: 12900, stock: 88, image: campingChair },
  { no: 102316, name: '초경량 접이식 스툴', category: '캠핑 의자', price: 16800, stock: 140, image: campingChair },
  { no: 102317, name: '알루미늄 로우 체어 2개 세트', category: '캠핑 의자', price: 64000, stock: 22, image: campingChair },
  { no: 102318, name: '감성 LED 스트링 라이트 10m', category: '캠핑 소품', price: 14900, stock: 0, image: lantern },
  { no: 102319, name: '캠핑 사이드 테이블 미니', category: '캠핑 테이블', price: 24900, stock: 61, image: campingTable },
  { no: 102320, name: '빈티지 우드 캠핑 체어', category: '캠핑 의자', price: 78000, stock: 9, image: campingChair },
  { no: 102321, name: '캠핑 랜턴 걸이 스탠드', category: '캠핑 소품', price: 19800, stock: 47, image: lantern },
]

const SEED_ORDERS: SellerOrder[] = [
  { no: '20261022-000201', item: '릴렉스 캠핑 체어 하이백 외 1', buyer: '김*진', amount: 75600, status: '배송준비' },
  { no: '20261022-000197', item: '무선 충전식 캠핑 랜턴', buyer: '이*수', amount: 22800, status: '배송준비' },
  { no: '20261022-000193', item: '롤 테이블 + 체어 세트 ×6', buyer: '박*호', amount: 539400, status: '배송준비', suspicious: '가입 당일 · 같은 상품 6개 · 배송지와 결제 지역이 달라요' },
  { no: '20261022-000188', item: '캠핑 의자 수납 가방', buyer: '최*영', amount: 12900, status: '배송준비' },
  { no: '20261022-000184', item: '무선 충전식 캠핑 랜턴 ×2', buyer: '정*아', amount: 45600, status: '배송준비' },
  { no: '20261023-000012', item: '초경량 접이식 스툴', buyer: '한*비', amount: 16800, status: '결제완료' },
  { no: '20261023-000009', item: '캠핑 사이드 테이블 미니', buyer: '오*린', amount: 24900, status: '결제완료' },
  { no: '20261021-000140', item: '빈티지 우드 캠핑 체어', buyer: '윤*서', amount: 78000, status: '배송중', invoice: 'CJ 6021-3381-2207' },
  { no: '20261021-000131', item: '릴렉스 캠핑 체어 하이백', buyer: '장*우', amount: 52800, status: '배송중', invoice: 'CJ 6021-3381-2190' },
  { no: '20261021-000120', item: '캠핑 랜턴 걸이 스탠드', buyer: '임*하', amount: 19800, status: '배송중', invoice: 'CJ 6021-3381-2175' },
  { no: '20261019-000098', item: '알루미늄 로우 체어 2개 세트', buyer: '서*준', amount: 64000, status: '배송완료', invoice: 'CJ 6021-3380-9921' },
  { no: '20261018-000077', item: '무선 충전식 캠핑 랜턴', buyer: '강*민', amount: 22800, status: '배송완료', invoice: 'CJ 6021-3380-9800' },
]

const SEED_CLAIMS: SellerClaim[] = [
  {
    id: 'sc1',
    type: '반품',
    priority: '높음',
    date: '10.21',
    orderNo: '20261021-000155',
    product: '롤 테이블 + 체어 세트',
    reason: '상품 불량 · 다리 휨',
    quote: '받자마자 테이블 다리 한쪽이 휘어 있었어요. 캠핑장에서 쓰려고 산 건데 너무 속상하네요. 빨리 처리해 주세요.',
    photos: 3,
    refund: 89900,
    analysis: { fault: '판매자 (배송 중 파손 추정)', mood: '불만 · 강함', urgency: '높음 · 24시간 내', action: '반품 승인 후 같은 상품 교환을 먼저 제안하세요. 사진상 다리 연결부 휨이 확인되고, 같은 로트 클레임이 이번 주 2건 더 있어요.' },
  },
  {
    id: 'sc2',
    type: '반품',
    priority: '보통',
    date: '10.20',
    orderNo: '20261020-000118',
    product: '캠핑 의자 수납 가방',
    reason: '설명과 다름',
    quote: '상세 페이지 사진보다 가방이 작아서 의자가 잘 안 들어가요.',
    photos: 1,
    refund: 12900,
    analysis: { fault: '판매자 (설명 부족)', mood: '아쉬움 · 보통', urgency: '보통 · 3일 내', action: '반품을 승인하고 상세 페이지에 가방 안쪽 치수를 추가하세요. 같은 내용의 리뷰가 7건 있어요.' },
  },
  {
    id: 'sc3',
    type: '취소',
    priority: '보통',
    date: '10.20',
    orderNo: '20261020-000102',
    product: '무선 충전식 캠핑 랜턴',
    reason: '단순 변심',
    quote: '다른 색으로 다시 주문하려고 취소해요.',
    photos: 0,
    refund: 22800,
    analysis: { fault: '구매자 (단순 변심)', mood: '보통', urgency: '보통 · 출고 전', action: '출고 전이라 바로 취소를 승인하면 돼요. 같은 구매자가 다른 색으로 재주문할 가능성이 높아요.' },
  },
]

/** 예시 스토어(캠프로 스토어) 주인 — 로그인 예시 계정과 같다 */
export const DEMO_SELLER_EMAIL = 'abc@accio.kr'

const profileStore = createStore<SellerProfile | null>('accio:seller:profile', () => ({
  email: DEMO_SELLER_EMAIL,
  storeName: '캠프로 스토어',
  owner: '김캠프',
  bizNo: '123-45-67890',
  phone: '02-000-0000',
  shipping: '5만원 이상 무료',
}))
const productStore = createStore<SellerProduct[]>('accio:seller:products', () => SEED_PRODUCTS)
const orderStore = createStore<SellerOrder[]>('accio:seller:orders', () => SEED_ORDERS)
const claimStore = createStore<SellerClaim[]>('accio:seller:claims', () => SEED_CLAIMS)

export const useSellerProfile = profileStore.use
export const useSellerProducts = productStore.use
export const useSellerOrders = orderStore.use
export const useSellerClaims = claimStore.use

export const sellerActions = {
  register: (profile: SellerProfile) => profileStore.set(profile),
  addProduct: (product: Omit<SellerProduct, 'no'>) =>
    productStore.set((list) => [{ ...product, no: Math.max(...list.map((p) => p.no), 102309) + 1 }, ...list]),
  removeProducts: (nos: number[]) => productStore.set((list) => list.filter((p) => !nos.includes(p.no))),
  toggleHidden: (no: number) => productStore.set((list) => list.map((p) => (p.no === no ? { ...p, hidden: !p.hidden } : p))),
  setOrderStatus: (nos: string[], status: SellerOrderStatus) =>
    orderStore.set((list) => list.map((o) => (nos.includes(o.no) ? { ...o, status } : o))),
  /** 송장 일괄 등록 — 목업이라 CJ대한통운 번호를 차례로 붙인다 */
  registerInvoices: (nos: string[]) =>
    orderStore.set((list) =>
      list.map((o, i) => (nos.includes(o.no) && !o.invoice && !o.suspicious ? { ...o, invoice: `CJ 6021-3382-${String(1000 + i).padStart(4, '0')}` } : o)),
    ),
  resolveSuspicious: (no: string) => orderStore.set((list) => list.map((o) => (o.no === no ? { ...o, suspicious: undefined } : o))),
  resolveClaim: (id: string, result: NonNullable<SellerClaim['result']>) => claimStore.set((list) => list.map((c) => (c.id === id ? { ...c, result } : c))),
}

/** 최근 7일 매출(원) — 마지막이 오늘 */
export const WEEKLY_SALES = [
  { day: '16', amount: 298000 },
  { day: '17', amount: 341000 },
  { day: '18', amount: 262000 },
  { day: '19', amount: 389000 },
  { day: '20', amount: 365000 },
  { day: '21', amount: 410000 },
  { day: '오늘', amount: 482300 },
]

export const AI_INSIGHTS = [
  '‘릴렉스 캠핑 체어’ 조회수가 지난주보다 42% 늘었어요. 재고 18개라 이번 주 품절이 예상돼요.',
  '‘캠핑 의자 수납 가방’ 리뷰에 “지퍼가 뻑뻑하다”는 말이 7건 나왔어요. 상세 설명 보완을 권해요.',
  '검색어 “차박 의자”로 들어온 손님이 늘었어요. 상품명에 넣어 보세요.',
]
