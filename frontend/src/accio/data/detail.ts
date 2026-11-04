// 상품 상세 목데이터 — 시안(초경량 접이식 캠핑 의자)의 옵션·리뷰. 다른 상품은 기본 옵션과 공통 리뷰를 쓴다.
import { listPriceOf, PRODUCTS, type Product } from './catalog'

export interface ColorOption {
  name: string
  /** 색 견본 — 시안 색상 칩 그대로 */
  swatch: string
}

export interface ProductOptions {
  colors?: ColorOption[]
  sizes?: { name: string; soldOut?: boolean }[]
}

export const REVIEW_TOPICS = ['품질', '배송', '가성비', '디자인', '사이즈'] as const
export type ReviewTopic = (typeof REVIEW_TOPICS)[number]

export interface Review {
  id: string
  author: string
  rating: number
  ago: string
  /** 최신순 정렬용 — 며칠 전에 썼는지 */
  daysAgo: number
  option: string
  body: string
  /** 본문에서 AI 요약 키워드와 겹쳐 강조할 말 */
  highlight?: string
  photos?: number
  helpful: number
  aiPick?: boolean
  topics: ReviewTopic[]
}

export interface ReviewSummary {
  summary: string
  pros: string[]
  cons: string[]
  tags: string[]
  /** 5점 → 1점 비율(%) */
  distribution: [number, number, number, number, number]
}

const CHAIR_OPTIONS: ProductOptions = {
  colors: [
    { name: '샌드', swatch: '#D8CBB8' },
    { name: '올리브', swatch: '#5B5B52' },
    { name: '포레스트', swatch: '#2E3A33' },
    { name: '스카이', swatch: '#B9C2C9' },
  ],
  sizes: [{ name: '기본' }, { name: '와이드' }, { name: '하이백', soldOut: true }],
}

const CHAIR_SUMMARY: ReviewSummary = {
  summary: '대부분 “생각보다 가볍고 튼튼하다”는 평이에요. 등받이가 높아 오래 앉아도 편하지만, 수납 가방이 조금 빡빡하다는 의견이 있어요.',
  pros: ['무게 1.9kg로 가벼움', '설치 30초', '등받이 높이'],
  cons: ['수납 가방이 좁음', '팔걸이 없음'],
  tags: ['#가벼움', '#튼튼함', '#설치쉬움', '#가성비'],
  distribution: [82, 12, 4, 1, 1],
}

const CHAIR_REVIEWS: Review[] = [
  { id: 'r1', author: '캠핑초보', rating: 5, ago: '4주 전', daysAgo: 28, option: '색상: 샌드 · 사이즈: 기본', body: '생각보다 가볍고 튼튼해요. 차에 싣고 다니기 좋고 등받이가 높아서 오래 앉아 있어도 허리가 편했어요.', highlight: '가볍고', photos: 3, helpful: 24, aiPick: true, topics: ['품질'] },
  { id: 'r2', author: '주말캠퍼', rating: 5, ago: '1달 전', daysAgo: 33, option: '색상: 샌드 · 사이즈: 기본', body: '설치가 정말 쉬워요. 다만 수납 가방이 조금 빡빡해서 넣을 때 요령이 필요해요.', helpful: 24, topics: ['품질', '사이즈'] },
  { id: 'r3', author: '차박러', rating: 5, ago: '2달 전', daysAgo: 61, option: '색상: 샌드 · 사이즈: 기본', body: '가볍고 색감이 예뻐요. 두 개 사서 하나는 베란다에 두고 씁니다.', highlight: '가볍고', helpful: 24, aiPick: true, topics: ['디자인', '가성비'] },
  { id: 'r4', author: '솔캠러', rating: 4, ago: '2달 전', daysAgo: 66, option: '색상: 포레스트 · 사이즈: 와이드', body: '와이드라 엉덩이가 편해요. 주문 다음 날 바로 와서 주말에 잘 썼습니다.', photos: 1, helpful: 9, topics: ['배송', '사이즈'] },
  { id: 'r5', author: '가성비왕', rating: 5, ago: '3달 전', daysAgo: 92, option: '색상: 올리브 · 사이즈: 기본', body: '이 가격에 이 정도면 만족이에요. 프레임도 흔들림 없이 단단합니다.', helpful: 6, topics: ['가성비', '품질'] },
]

const GENERIC_SUMMARY: ReviewSummary = {
  summary: '“가격 대비 만족스럽다”는 평이 많아요. 배송이 빠르다는 칭찬이 많고, 포장이 아쉽다는 의견이 일부 있어요.',
  pros: ['가격 대비 품질', '빠른 배송'],
  cons: ['포장이 간단함'],
  tags: ['#가성비', '#빠른배송', '#재구매'],
  distribution: [76, 16, 5, 2, 1],
}

const GENERIC_REVIEWS: Review[] = [
  { id: 'g1', author: '알뜰살뜰', rating: 5, ago: '1주 전', daysAgo: 7, option: '기본', body: '가격 대비 품질이 좋아요. 주문하고 다음 날 받아서 바로 썼어요.', highlight: '가격 대비', helpful: 12, aiPick: true, topics: ['가성비', '배송'] },
  { id: 'g2', author: '꼼꼼리뷰', rating: 4, ago: '3주 전', daysAgo: 21, option: '기본', body: '사진이랑 똑같고 마감도 깔끔해요. 포장은 조금 간단했어요.', photos: 2, helpful: 5, topics: ['품질', '디자인'] },
  { id: 'g3', author: '재구매각', rating: 5, ago: '1달 전', daysAgo: 35, option: '기본', body: '두 번째 구매예요. 크기도 딱 맞고 오래 써도 괜찮네요.', helpful: 3, topics: ['사이즈', '품질'] },
]

export function getDetail(product: Product) {
  const isChair = product.id === PRODUCTS.campingChair.id
  return {
    title: product.fullName ?? product.name,
    options: isChair ? CHAIR_OPTIONS : {},
    summary: isChair ? CHAIR_SUMMARY : GENERIC_SUMMARY,
    reviews: product.reviewCount === 0 ? [] : isChair ? CHAIR_REVIEWS : GENERIC_REVIEWS,
    listPrice: listPriceOf(product),
    /** 적립 1% (10원 단위 버림) */
    points: Math.floor((product.price * 0.01) / 10) * 10,
    description: [
      `${product.brand}에서 만든 ${product.name}이에요.`,
      '매일 쓰기 좋게 가볍고 튼튼한 소재로 만들었고, 받은 날부터 바로 쓸 수 있어요.',
    ],
    specs: [
      ['브랜드', product.brand],
      ['분야', product.category],
      ['배송', product.delivery?.join(' · ') ?? '일반배송'],
      ['원산지', '상세 이미지 참고'],
    ] as [string, string][],
  }
}

export const SHIPPING_INFO: [string, string][] = [
  ['배송비', '무료배송 (제주·도서산간 3,000원 추가)'],
  ['도착 예정', '오늘 오후 2시 전 주문 시 내일 도착'],
  ['교환·반품', '받은 날부터 7일 안에 마이페이지에서 신청'],
  ['반품 배송비', '단순 변심 시 왕복 6,000원'],
]
