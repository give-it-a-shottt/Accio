import { EVENT_BANNERS } from '../data/catalog'
import { accioHref } from '../routes'
import { AiDot, BLEED_TRACK_CLASS, CarouselControls, Container, SectionHeader } from '../ui/primitives'
import useScroller from '../ui/useScroller'

/**
 * 진행 중인 기획전 — 화면 끝까지 이어지는 카드 트랙. 사진 아래쪽을 흰색으로 흐려 글씨를 얹는다.
 * PC 384×300 · 모바일 310×200. 진행 막대는 지금 보이는 구간을 그린다.
 */
export default function EventCarousel() {
  const [trackRef, scroller] = useScroller()

  return (
    <section aria-label="진행 중인 기획전" className="flex flex-col gap-3 pt-6 lg:gap-6 lg:pt-14">
      <Container className="hidden lg:block">
        <SectionHeader
          title="진행 중인 기획전"
          description="지금 놓치면 아쉬운 혜택"
          aside={
            <CarouselControls
              pad
              index={scroller.index}
              count={scroller.count}
              onPrev={scroller.prev}
              onNext={scroller.next}
            />
          }
        />
      </Container>

      <div ref={trackRef} className={`${BLEED_TRACK_CLASS} gap-3 lg:gap-5`}>
        {EVENT_BANNERS.map((banner) => (
          <a
            key={banner.title}
            href={accioHref('/list')}
            className="relative flex h-50 w-[310px] shrink-0 snap-start flex-col justify-end gap-1 overflow-hidden rounded-lg p-5 lg:h-75 lg:w-96 lg:gap-1.5 lg:rounded-xl lg:p-7"
          >
            <img src={banner.image} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
            <span aria-hidden className="absolute inset-0 bg-linear-to-b from-white/0 from-35% to-white/92" />
            <span className="relative flex w-fit items-center gap-1 rounded-xs bg-white px-1.5 py-0.5 text-11 font-semibold text-sub lg:px-2 lg:py-[3px]">
              {banner.ai && <AiDot size={6.3} />}
              {banner.tag}
            </span>
            <span className="relative text-20 font-semibold text-main lg:text-24">{banner.title}</span>
            <span className="relative text-13 text-sub lg:text-14">
              <span className="lg:hidden">{banner.shortDescription ?? banner.description}</span>
              <span className="hidden lg:inline">{banner.description}</span>
            </span>
          </a>
        ))}
      </div>

      {/* 진행 막대 — 모바일은 오른쪽에 '1 / 4' (넘길 수 있는 위치 수) */}
      <Container className="flex items-center gap-2.5">
        <div className="relative h-0.5 flex-1 overflow-hidden bg-regular">
          <div
            className="absolute inset-y-0 bg-black transition-[left] duration-200"
            style={{ left: `${scroller.start * 100}%`, width: `${scroller.visible * 100}%` }}
          />
        </div>
        <p className="flex gap-0.5 text-12 tabular-nums lg:hidden">
          <span className="font-semibold text-main">{scroller.index}</span>
          <span className="text-sub-weak">/ {scroller.count}</span>
        </p>
      </Container>
    </section>
  )
}
