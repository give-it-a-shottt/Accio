import { useCallback, useEffect, useRef, useState } from 'react'

interface ScrollState {
  /** 지금 맨 앞에 보이는 카드 번호(1부터) */
  index: number
  /** 한 칸씩 넘길 때 멈출 수 있는 위치 수 — 카드 8장 중 5장이 보이면 4 */
  count: number
  /** 진행 막대 — 보이는 비율과 시작 위치(0~1) */
  visible: number
  start: number
}

/**
 * 가로 스크롤 트랙(카드 캐러셀) 상태. 버튼은 카드 한 칸(카드 폭 + 간격)씩 넘기고,
 * 손가락·트랙패드로 밀어도 위치 표시가 따라온다.
 */
export default function useScroller<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [state, setState] = useState<ScrollState>({ index: 1, count: 1, visible: 1, start: 0 })

  const stride = useCallback(() => {
    const el = ref.current
    const [first, second] = el ? Array.from(el.children) as HTMLElement[] : []
    if (!first) return 1
    return second ? second.offsetLeft - first.offsetLeft : first.offsetWidth
  }, [])

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const step = stride()
    const max = el.scrollWidth - el.clientWidth
    setState({
      index: Math.round(el.scrollLeft / step) + 1,
      count: Math.max(1, Math.round(max / step) + 1),
      visible: Math.min(1, el.clientWidth / el.scrollWidth),
      start: max > 0 ? (el.scrollLeft / max) * (1 - el.clientWidth / el.scrollWidth) : 0,
    })
  }, [stride])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [measure])

  const scrollByStep = (direction: 1 | -1) => ref.current?.scrollBy({ left: stride() * direction, behavior: 'smooth' })

  // ref 와 화면에 그릴 상태를 따로 돌려준다 — 한 객체에 섞으면 렌더 중 ref 를 읽는 것으로 본다(react-hooks/refs)
  return [ref, { ...state, prev: () => scrollByStep(-1), next: () => scrollByStep(1) }] as const
}
