import { useSyncExternalStore } from 'react'

/** CSS 미디어 쿼리 일치 여부. placeholder 처럼 CSS 로 바꿀 수 없는 값을 브레이크포인트별로 고를 때 쓴다. */
export default function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
