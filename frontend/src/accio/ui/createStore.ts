import { useSyncExternalStore } from 'react'

/**
 * 브라우저(localStorage)에 남는 작은 저장소. 목업이라 서버 대신 쓰고, 여러 화면이 같은 값을 구독한다.
 * 저장이 막힌 환경(시크릿 창 등)에서도 이번 방문 동안은 메모리로 동작한다.
 */
export default function createStore<T>(key: string, seed: () => T) {
  const listeners = new Set<() => void>()
  let value: T
  try {
    const saved = localStorage.getItem(key)
    value = saved ? (JSON.parse(saved) as T) : seed()
  } catch {
    value = seed()
  }

  const get = () => value
  const set = (next: T | ((prev: T) => T)) => {
    value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // 저장이 막혀도 이번 방문 동안은 유지된다
    }
    listeners.forEach((notify) => notify())
  }
  const subscribe = (notify: () => void) => {
    listeners.add(notify)
    return () => listeners.delete(notify)
  }
  const use = () => useSyncExternalStore(subscribe, get, get)

  return { get, set, use }
}
