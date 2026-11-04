import { PRODUCTS } from '../data/catalog'
import createStore from './createStore'

// 내 정보 화면들의 목업 데이터 — 리뷰·최근 본 상품·자주 산 상품

export interface MyReview {
  id: string
  productId: string
  orderNo: string
  rating: number
  body: string
  photos: number
  /** ISO 날짜 */
  writtenAt: string
}

const SEED_REVIEWS: MyReview[] = [
  { id: 'mr1', productId: PRODUCTS.campingChair.id, orderNo: '20261001-000020', rating: 5, body: '생각보다 가볍고 튼튼해요. 등받이가 높아서 오래 앉아 있어도 편했어요.', photos: 0, writtenAt: '2026-10-08T10:00:00+09:00' },
  { id: 'mr2', productId: PRODUCTS.campingLantern.id, orderNo: '20260925-000044', rating: 5, body: '밝기 3단계가 유용하고 충전도 빨라요. 텐트 안에서 딱 좋아요.', photos: 0, writtenAt: '2026-09-30T10:00:00+09:00' },
  { id: 'mr3', productId: PRODUCTS.winterBedding.id, orderNo: '20260905-000013', rating: 5, body: '두께감이 좋아서 보일러 덜 틀어도 따뜻해요.', photos: 0, writtenAt: '2026-09-12T10:00:00+09:00' },
]

const reviewStore = createStore<MyReview[]>('accio:my-reviews', () => SEED_REVIEWS)

export const useMyReviews = reviewStore.use
export const reviewActions = {
  write: (review: Omit<MyReview, 'id' | 'writtenAt'>) =>
    reviewStore.set((list) => [{ ...review, id: `mr${Date.now()}`, writtenAt: new Date().toISOString() }, ...list]),
  update: (id: string, change: Pick<MyReview, 'rating' | 'body'>) => reviewStore.set((list) => list.map((r) => (r.id === id ? { ...r, ...change } : r))),
  remove: (id: string) => reviewStore.set((list) => list.filter((r) => r.id !== id)),
}

// ── 최근 본 상품 ─────────────────────────────────────────────────────────

export interface RecentView {
  productId: string
  /** ms */
  viewedAt: number
}

const at = (daysAgo: number, hh: number, mm: number) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hh, mm, 0, 0)
  return d.getTime()
}

// 시안(최근 본 상품 430:2455)처럼 오늘 3개 · 어제 2개
const recentStore = createStore<RecentView[]>('accio:recent', () => [
  { productId: PRODUCTS.campingChair.id, viewedAt: at(0, 14, 20) },
  { productId: PRODUCTS.campingLantern.id, viewedAt: at(0, 13, 58) },
  { productId: PRODUCTS.electricBlanket.id, viewedAt: at(0, 13, 41) },
  { productId: PRODUCTS.woolHalfCoat.id, viewedAt: at(1, 21, 10) },
  { productId: PRODUCTS.woolLamp.id, viewedAt: at(1, 20, 3) },
])

export const useRecentViews = recentStore.use
export const recentActions = {
  /** 상세 화면을 열 때 맨 앞으로 — 같은 상품은 한 번만, 최대 30개 */
  record: (productId: string) =>
    recentStore.set((list) => [{ productId, viewedAt: Date.now() }, ...list.filter((v) => v.productId !== productId)].slice(0, 30)),
  remove: (productId: string) => recentStore.set((list) => list.filter((v) => v.productId !== productId)),
  clear: () => recentStore.set([]),
}

// ── 자주 산 상품(재구매) ──────────────────────────────────────────────────

/** 시안(재구매 430:2704)의 자주 산 상품 — 몇 번 샀고 마지막으로 언제 샀는지 */
export const FREQUENT_PURCHASES = [
  { productId: PRODUCTS.decoTissue.id, count: 5, last: '09.23', cycleDays: 28, daysSince: 29 },
  { productId: PRODUCTS.organicApple.id, count: 3, last: '10.02', cycleDays: 35, daysSince: 21 },
  { productId: 'soft-tofu-400', count: 4, last: '10.15', cycleDays: 14, daysSince: 8 },
  { productId: PRODUCTS.capsuleDetergent.id, count: 2, last: '08.30', cycleDays: 60, daysSince: 54 },
]
