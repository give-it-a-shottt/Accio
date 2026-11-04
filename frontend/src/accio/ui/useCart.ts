import { useSyncExternalStore } from 'react'
import { ALL_PRODUCTS, listPriceOf, PRODUCTS, type Product } from '../data/catalog'

// 장바구니 — 화면을 옮겨도 유지되도록 localStorage 에 둔다(목업이라 서버 없이 브라우저에만).
export interface CartItem {
  /** 상품 + 옵션 조합 키 — 같은 옵션을 또 담으면 수량만 늘린다 */
  key: string
  productId: string
  option: string
  quantity: number
  checked: boolean
}

const KEY = 'accio:cart'
const listeners = new Set<() => void>()

const seed = (product: Product, option: string, quantity: number, checked: boolean): CartItem => ({
  key: `${product.id}|${option}`,
  productId: product.id,
  option,
  quantity,
  checked,
})

// 처음 들어온 사람에게도 시안(장바구니 424:971)처럼 4개(1개는 품절)가 담겨 있도록 한다
const SEED: CartItem[] = [
  seed(PRODUCTS.campingChair, '샌드 / 기본', 1, true),
  seed(PRODUCTS.campingLantern, '화이트', 2, true),
  seed(PRODUCTS.electricBlanket, '그레이', 1, false),
  seed(PRODUCTS.chairBag, '블랙', 1, false),
]

function read(): CartItem[] {
  try {
    const saved = localStorage.getItem(KEY)
    return saved ? JSON.parse(saved) : SEED
  } catch {
    return SEED
  }
}

let snapshot = read()

function write(next: CartItem[]) {
  snapshot = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // 저장이 막혀도 이번 방문 동안은 유지된다
  }
  listeners.forEach((notify) => notify())
}

function subscribe(notify: () => void) {
  listeners.add(notify)
  return () => listeners.delete(notify)
}

export const findProduct = (id: string) => ALL_PRODUCTS.find((p) => p.id === id)

export const cartActions = {
  add(product: Product, option: string, quantity: number) {
    const key = `${product.id}|${option}`
    const existing = snapshot.find((item) => item.key === key)
    write(
      existing
        ? snapshot.map((item) => (item.key === key ? { ...item, quantity: item.quantity + quantity, checked: true } : item))
        : [...snapshot, { key, productId: product.id, option, quantity, checked: true }],
    )
  },
  setQuantity: (key: string, quantity: number) =>
    write(snapshot.map((item) => (item.key === key ? { ...item, quantity: Math.max(1, Math.min(99, quantity)) } : item))),
  toggle: (key: string) => write(snapshot.map((item) => (item.key === key ? { ...item, checked: !item.checked } : item))),
  toggleAll: (checked: boolean) => write(snapshot.map((item) => ({ ...item, checked }))),
  remove: (keys: string[]) => write(snapshot.filter((item) => !keys.includes(item.key))),
}

/** 배송비 — 결제할 상품 금액이 3만원 이상이면 무료 */
export const shippingFee = (amount: number) => (amount === 0 || amount >= 30000 ? 0 : 3000)

/** 결제할 항목(체크했고 품절 아닌 것)과 금액 — 장바구니·주문서가 같이 쓴다 */
export function summarize(items: CartItem[]) {
  const lines = items
    .map((item) => ({ item, product: findProduct(item.productId) }))
    .filter((line): line is { item: CartItem; product: Product } => !!line.product)
  const payable = lines.filter(({ item, product }) => item.checked && !product.soldOut)
  const listTotal = payable.reduce((sum, { item, product }) => sum + listPriceOf(product) * item.quantity, 0)
  const saleTotal = payable.reduce((sum, { item, product }) => sum + product.price * item.quantity, 0)
  const fee = shippingFee(saleTotal)
  return { lines, payable, listTotal, discount: listTotal - saleTotal, fee, total: saleTotal + fee }
}

export default function useCart() {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
}
