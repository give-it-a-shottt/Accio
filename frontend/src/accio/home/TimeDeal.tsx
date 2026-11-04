import { useEffect, useState } from 'react'
import { TIME_DEAL } from '../data/catalog'
import { accioHref } from '../routes'
import ProductCard from '../ui/ProductCard'
import { ArrowButton, BLEED_TRACK_CLASS, Container, SectionHeader, ViewAllLink } from '../ui/primitives'
import useScroller from '../ui/useScroller'

/** 오늘 자정까지 남은 시간 'HH:MM:SS' — 1초마다 줄어든다 */
function useCountdownToMidnight() {
  const remaining = () => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    const total = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000))
    return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60].map((n) => String(n).padStart(2, '0')).join(':')
  }
  const [text, setText] = useState(remaining)
  useEffect(() => {
    const id = window.setInterval(() => setText(remaining()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return text
}

/**
 * 오늘의 특가 — 오른쪽으로 잘린 카드가 '더 있다'를 알려 주는 트랙.
 * PC 카드 282 · 간격 24, 모바일 140 · 12. PC 는 트랙 위 오른쪽에 큰 화살표가 떠 있다.
 */
export default function TimeDeal() {
  const countdown = useCountdownToMidnight()
  const [trackRef, scroller] = useScroller()

  return (
    <section aria-label="오늘의 특가" className="flex flex-col gap-3.5 pt-12 lg:gap-6 lg:pt-24">
      <Container>
        <SectionHeader
          title={
            <span className="flex items-center gap-2 lg:gap-3">
              오늘의 특가
              <span className="flex items-center gap-1.5 rounded-[6px] bg-regular px-2 py-[3px] lg:px-2.5 lg:py-1">
                <span className="hidden text-12 font-medium text-sub lg:inline">남은 시간</span>
                <span className="text-12 font-semibold text-main tabular-nums lg:text-14" aria-label={`남은 시간 ${countdown}`}>
                  {countdown}
                </span>
              </span>
            </span>
          }
          aside={<ViewAllLink href={accioHref('/list')} />}
        />
      </Container>

      <div className="relative">
        <div ref={trackRef} className={`${BLEED_TRACK_CLASS} gap-3 lg:gap-6`}>
          {TIME_DEAL.map((product) => (
            <ProductCard key={product.id} product={product} className="w-35 shrink-0 snap-start lg:w-[282px]" />
          ))}
        </div>
        {/* 화살표는 콘텐츠 오른쪽 끝(1200)에 반쯤 걸쳐 썸네일 가운데 높이에 둔다 */}
        <div className="pointer-events-none absolute inset-x-0 top-[117px] hidden lg:block">
          <Container className="relative">
            {scroller.index > 1 && (
              <ArrowButton direction="prev" size={48} floating onClick={scroller.prev} className="pointer-events-auto absolute -left-1" />
            )}
            {scroller.index < scroller.count && (
              <ArrowButton direction="next" size={48} floating onClick={scroller.next} className="pointer-events-auto absolute -right-1" />
            )}
          </Container>
        </div>
      </div>
    </section>
  )
}
