import { useSyncExternalStore } from 'react'

/** 현재 location.hash 경로 ('#/login' → '/login', 없으면 '/'). 라우터 없이 페이지를 전환할 때 쓴다. */
export default function useHashRoute() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('hashchange', onChange)
      return () => window.removeEventListener('hashchange', onChange)
    },
    () => window.location.hash.replace(/^#/, '') || '/',
    () => '/',
  )
}
