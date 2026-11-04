// 검색 · 상품 API (FastAPI /api) — 개발 중에는 Vite 프록시가, 배포에서는 같은 도메인의 Vercel 함수가 받는다.
import type { Product, ProductDetail } from './data/catalog'
import { rememberProducts } from './ui/productCache'

export interface SearchResult {
  query: string
  /** keyword = 검색어 그대로(S0), parsed = Gemini 해석(P3), hybrid = 임베딩 혼합(P4) */
  mode: 'keyword' | 'parsed' | 'hybrid'
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

export async function searchProducts(query: string, signal?: AbortSignal) {
  const result = await getJson<SearchResult>(`/search?q=${encodeURIComponent(query)}&limit=60`, signal)
  // 장바구니 · 찜 · 최근 본 상품이 나중에 id 로 찾을 수 있게 기억해 둔다
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
