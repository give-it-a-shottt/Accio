// 검색 · 상품 API (FastAPI /api) — 개발 중에는 Vite 프록시가, 배포에서는 같은 도메인의 Vercel 함수가 받는다.
import type { Product, ProductDetail } from './data/catalog'
import { rememberProducts } from './ui/productCache'

/** Gemini 가 이해한 검색 조건 — '이렇게 이해했어요' 칩 */
export interface Interpreted {
  productTypes: string[]
  terms: string[]
  category: string | null
  priceMin: number | null
  priceMax: number | null
  exclude: string[]
}

export interface SearchResult {
  query: string
  /** keyword = 검색어 그대로(S0), parsed = Gemini 해석(P3), hybrid = 임베딩 혼합(P4) */
  mode: 'keyword' | 'parsed' | 'hybrid'
  interpreted: Interpreted | null
  /** AI 해석을 시도했다가 검색어 그대로 찾았을 때 이유 */
  fallbackReason: 'timeout' | 'error' | 'no_key' | 'cooldown' | null
  total: number
  products: Product[]
}

/** API 가 응답하지 않거나 오류를 돌려줬을 때 — 화면은 목 데이터로 넘어간다 */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, { signal })
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new ApiError('서버에 연결하지 못했어요', 0)
  }
  if (!response.ok) throw new ApiError(`API ${response.status}`, response.status)
  return response.json() as Promise<T>
}

/** exact = 검색어 그대로(AI 해석 없이) — '이렇게 이해했어요'가 틀렸을 때 사용자가 고른다 */
export async function searchProducts(query: string, signal?: AbortSignal, exact = false) {
  const mode = exact ? '&mode=keyword' : ''
  const result = await getJson<SearchResult>(`/search?q=${encodeURIComponent(query)}&limit=60${mode}`, signal)
  // 장바구니 · 찜 · 최근 본 상품이 나중에 id 로 찾을 수 있게 기억해 둔다
  rememberProducts(result.products)
  return result
}

export interface ChatResult {
  reply: string[]
  chips: string[]
  /** search = AI 가 해석해 찾음, keyword = AI 가 늦어 규칙으로 찾음, chat = 쇼핑과 무관한 말 */
  kind: 'search' | 'keyword' | 'chat'
  interpreted: Interpreted | null
  total: number
  products: Product[]
}

/** AI 채팅 — previous 는 이 대화에서 마지막으로 쓴 검색 조건('5만원 이하로' 같은 이어지는 말을 합친다) */
export async function chatSearch(message: string, previous: Interpreted | null) {
  let response: Response
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, previous }),
    })
  } catch {
    throw new ApiError('서버에 연결하지 못했어요', 0)
  }
  if (!response.ok) throw new ApiError(`API ${response.status}`, response.status)
  const result = (await response.json()) as ChatResult
  rememberProducts(result.products)
  return result
}

export async function getProduct(id: string, signal?: AbortSignal) {
  const product = await getJson<ProductDetail>(`/products/${encodeURIComponent(id)}`, signal)
  rememberProducts([product])
  return product
}

export async function getRelated(id: string, signal?: AbortSignal) {
  const products = await getJson<Product[]>(`/products/${encodeURIComponent(id)}/related?limit=4`, signal)
  rememberProducts(products)
  return products
}
