import { PRODUCTS } from '../data/catalog'
import createStore from './createStore'
import { cartActions, type CartItem, findProduct, summarize } from './useCart'

// 주문 — 목업 결제(토스페이 테스트)로 만든 주문을 브라우저에 남긴다. 주문내역·배송 조회·취소/반품이 읽는다.
export interface OrderLine {
  productId: string
  option: string
  quantity: number
  price: number
}

export type OrderStatus = '결제완료' | '배송준비' | '배송중' | '배송완료' | '취소' | '반품'

export interface Order {
  no: string
  /** ISO 날짜 */
  orderedAt: string
  lines: OrderLine[]
  total: number
  method: string
  status: OrderStatus
}

export type ClaimStatus = '접수' | '승인' | '완료' | '거절'

/** 취소·반품 신청 */
export interface Claim {
  id: string
  type: '취소' | '반품'
  status: ClaimStatus
  /** ISO 날짜 */
  requestedAt: string
  orderNo: string
  productId: string
  reason: string
  detail?: string
  refund: number
  rejectReason?: string
}

const line = (product: { id: string; price: number }, option: string, quantity = 1): OrderLine => ({
  productId: product.id,
  option,
  quantity,
  price: product.price,
})

// 시안(주문내역 427:1989)과 같은 지난 주문 4건 — 처음 온 사람도 주문내역·취소/반품을 둘러볼 수 있다
const SEED_ORDERS: Order[] = [
  { no: '20261022-000184', orderedAt: '2026-10-22T15:02:00+09:00', lines: [line(PRODUCTS.campingChair, '샌드 / 기본'), line(PRODUCTS.campingLantern, '화이트', 2)], total: 85500, method: '토스페이 (테스트)', status: '배송중' },
  { no: '20261020-000091', orderedAt: '2026-10-20T11:20:00+09:00', lines: [line(PRODUCTS.winterBedding, '아이보리')], total: 59000, method: '토스페이 (테스트)', status: '결제완료' },
  { no: '20261012-000032', orderedAt: '2026-10-12T09:40:00+09:00', lines: [line(PRODUCTS.inductionPan, '기본')], total: 27500, method: '토스페이 (테스트)', status: '배송완료' },
  { no: '20261003-000008', orderedAt: '2026-10-03T19:15:00+09:00', lines: [line(PRODUCTS.ancEarbuds, '블랙')], total: 34800, method: '토스페이 (테스트)', status: '취소' },
]

// 시안(취소·반품 내역 429:2281)의 신청 4건
const SEED_CLAIMS: Claim[] = [
  { id: 'c1', type: '반품', status: '접수', requestedAt: '2026-10-21T10:00:00+09:00', orderNo: '20261012-000032', productId: PRODUCTS.inductionPan.id, reason: '상품 불량', detail: '손잡이 흔들림', refund: 27500 },
  { id: 'c2', type: '취소', status: '승인', requestedAt: '2026-10-19T10:00:00+09:00', orderNo: '20261018-000055', productId: PRODUCTS.electricBlanket.id, reason: '단순 변심', refund: 45500 },
  { id: 'c3', type: '취소', status: '완료', requestedAt: '2026-10-03T20:00:00+09:00', orderNo: '20261003-000008', productId: PRODUCTS.ancEarbuds.id, reason: '중복 주문', refund: 34800 },
  { id: 'c4', type: '반품', status: '거절', requestedAt: '2026-09-28T10:00:00+09:00', orderNo: '20260920-000071', productId: PRODUCTS.woolHalfCoat.id, reason: '단순 변심', refund: 0, rejectReason: '착용 흔적이 있어 반품이 어려워요 (택 제거)' },
]

const orderStore = createStore<Order[]>('accio:orders:v2', () => SEED_ORDERS)
const claimStore = createStore<Claim[]>('accio:claims', () => SEED_CLAIMS)

/** 테스트 결제 한도 — 넘으면 카드사 거절(REJECT_CARD_PAYMENT)로 실패 화면을 보여 준다 */
export const TEST_CARD_LIMIT = 1_000_000

export const PAYMENT_ERRORS: Record<string, { reason: string; short: string }> = {
  REJECT_CARD_PAYMENT: { reason: '카드 한도 초과', short: '카드 한도 초과' },
}

/** 'YYYYMMDD-000184' — 날짜 + 그날 주문 순번 */
function nextOrderNo(date: Date) {
  const day = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const sameDay = orderStore.get().filter((o) => o.no.startsWith(day)).length
  return `${day}-${String(184 + sameDay).padStart(6, '0')}`
}

/**
 * 장바구니에서 선택한 상품으로 결제한다. 성공하면 주문을 남기고 장바구니에서 뺀 뒤 주문번호를,
 * 한도를 넘으면 실패 코드를 돌려준다.
 */
export function placeOrder(items: CartItem[]): { ok: true; no: string } | { ok: false; code: string } {
  const { payable, total } = summarize(items)
  if (payable.length === 0) return { ok: false, code: 'EMPTY' }
  if (total > TEST_CARD_LIMIT) return { ok: false, code: 'REJECT_CARD_PAYMENT' }

  const now = new Date()
  const order: Order = {
    no: nextOrderNo(now),
    orderedAt: now.toISOString(),
    lines: payable.map(({ item, product }) => ({ productId: product.id, option: item.option, quantity: item.quantity, price: product.price })),
    total,
    method: '토스페이 (테스트)',
    status: '결제완료',
  }
  orderStore.set((orders) => [order, ...orders])
  cartActions.remove(payable.map(({ item }) => item.key))
  return { ok: true, no: order.no }
}

export const orderActions = {
  /** 결제완료 주문 취소 — 바로 승인되고 결제 금액 전체를 돌려준다 */
  cancel(order: Order, reason: string) {
    orderStore.set((orders) => orders.map((o) => (o.no === order.no ? { ...o, status: '취소' } : o)))
    claimStore.set((claims) => [
      { id: `c${Date.now()}`, type: '취소', status: '승인', requestedAt: new Date().toISOString(), orderNo: order.no, productId: order.lines[0].productId, reason, refund: order.total },
      ...claims,
    ])
  },
  /** 배송완료 상품 반품 신청 — 접수 상태로 남고, 단순 변심은 왕복 배송비 6,000원을 빼고 돌려준다 */
  requestReturn(order: Order, productId: string, reason: string, detail: string) {
    const lineItem = order.lines.find((l) => l.productId === productId) ?? order.lines[0]
    const amount = lineItem.price * lineItem.quantity
    claimStore.set((claims) => [
      {
        id: `c${Date.now()}`,
        type: '반품',
        status: '접수',
        requestedAt: new Date().toISOString(),
        orderNo: order.no,
        productId,
        reason,
        detail: detail || undefined,
        refund: reason.startsWith('단순 변심') ? Math.max(0, amount - 6000) : amount,
      },
      ...claims,
    ])
    orderStore.set((orders) => orders.map((o) => (o.no === order.no ? { ...o, status: '반품' } : o)))
  },
  /** 접수 상태의 반품 신청 철회 — 주문은 배송완료로 돌아간다 */
  withdraw(claim: Claim) {
    claimStore.set((claims) => claims.filter((c) => c.id !== claim.id))
    orderStore.set((orders) => orders.map((o) => (o.no === claim.orderNo && o.status === '반품' ? { ...o, status: '배송완료' } : o)))
  },
}

/** '내일(금)' — 오늘 기준 다음 날과 요일 */
export function arrivalLabel(from = new Date()) {
  const next = new Date(from)
  next.setDate(next.getDate() + 1)
  return `내일(${'일월화수목금토'[next.getDay()]})`
}

/** '2026.10.22' */
export const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export const useClaims = claimStore.use

export default function useOrders() {
  return orderStore.use()
}

/** 가장 최근 주문 — AI 주문 조회·재구매 답에 쓴다 */
export function latestOrder() {
  const order = orderStore.get()[0]
  if (!order) return undefined
  return {
    no: order.no,
    firstName: findProduct(order.lines[0].productId)?.name ?? '상품',
    productIds: order.lines.map((l) => l.productId),
  }
}
