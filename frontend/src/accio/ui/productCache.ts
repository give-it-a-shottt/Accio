// API 로 받은 생성 상품을 브라우저에 기억해 둔다.
// 장바구니 · 찜 · 최근 본 상품은 상품 id 만 저장하고 findProduct(id) 로 다시 찾는데,
// 생성 상품은 목 데이터(ALL_PRODUCTS)에 없으니 여기서 찾는다. 새로고침해도 남도록 localStorage 에 둔다.
import type { Product } from '../data/catalog'

const KEY = 'accio:products'
/** 넘으면 오래 쓴 순서대로 지운다. 생성 상품 전체(1,100개, 요약본 약 400KB)보다 크게 잡아
 *  장바구니 · 찜에 담은 상품이 지워지는 일은 실제로 없게 한다 */
const LIMIT = 1500

function read(): Record<string, Product> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

let cache = read()

/** 목록 · 상세에 필요한 요약만 저장한다(설명 · 리뷰는 상세 화면이 API 로 다시 받는다) */
function summary(product: Product): Product {
  const { id, brand, name, discountRate, price, rating, reviewCount, image, category, delivery, source, keyword, tags } = product
  return { id, brand, name, discountRate, price, rating, reviewCount, image, category, delivery, source, keyword, tags }
}

export function rememberProducts(products: Product[]) {
  if (products.length === 0) return
  // 다시 본 상품을 맨 뒤로 보내 '최근에 쓴 것'이 오래 남게 한다
  const next = { ...cache }
  for (const product of products) {
    delete next[product.id]
    next[product.id] = summary(product)
  }
  const ids = Object.keys(next)
  for (const id of ids.slice(0, Math.max(0, ids.length - LIMIT))) delete next[id]
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    // 저장이 막혀도 이번 방문 동안은 메모리에 남는다
  }
}

export const cachedProduct = (id: string): Product | undefined => cache[id]
