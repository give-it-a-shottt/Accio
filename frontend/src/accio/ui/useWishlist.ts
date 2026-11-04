import { useSyncExternalStore } from 'react'

// 찜한 상품 id 목록 — 화면을 옮겨도 유지되도록 localStorage 에 둔다(목업이라 서버 없이 브라우저에만).
const KEY = 'accio:wishlist'
const listeners = new Set<() => void>()

// 처음 온 사람에게도 시안(찜 429:1961)처럼 6개가 찜되어 있다
const SEED = ['camping-chair', 'wool-half-coat', 'wool-lamp', 'winter-bedding', 'induction-pan', 'cat-scratcher']

function read(): string[] {
  try {
    const saved = localStorage.getItem(KEY)
    return saved ? JSON.parse(saved) : SEED
  } catch {
    return SEED
  }
}

let snapshot = read()

function save(next: string[]) {
  snapshot = next
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot))
  } catch {
    // 시크릿 창 등에서 저장이 막혀도 이번 방문 동안은 유지된다
  }
  listeners.forEach((notify) => notify())
}

const toggle = (id: string) => save(snapshot.includes(id) ? snapshot.filter((x) => x !== id) : [id, ...snapshot])
const remove = (ids: string[]) => save(snapshot.filter((x) => !ids.includes(x)))

function subscribe(notify: () => void) {
  listeners.add(notify)
  return () => listeners.delete(notify)
}

export default function useWishlist() {
  const ids = useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
  return { ids, has: (id: string) => ids.includes(id), toggle, remove }
}
