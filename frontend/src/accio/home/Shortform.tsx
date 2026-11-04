import play from '../assets/v4/icons/play.svg'
import { productHref, SHORTFORMS } from '../data/catalog'
import { accioHref } from '../routes'
import { CarouselControls, Container, SectionHeader, ViewAllLink } from '../ui/primitives'
import useScroller from '../ui/useScroller'
import { formatWon } from '../utils/format'

/**
 * Accio 숏폼 — 세로 영상 카드 위에 작성자·조회수, 아래에 영상 속 상품 칩.
 * PC 는 5장이 한 줄(높이 398)에 들어오고 화살표로 한 장씩, 모바일은 150×266 카드를 가로로 민다.
 */
export default function Shortform() {
  const [trackRef, scroller] = useScroller()

  return (
    <section aria-label="Accio 숏폼" className="flex flex-col gap-3.5 pt-12 lg:gap-6 lg:pt-24">
      <Container>
        <SectionHeader
          title="Accio 숏폼"
          description="써 보고 고른 진짜 후기"
          aside={
            <>
              <span className="lg:hidden">
                <ViewAllLink href={accioHref('/list')} />
              </span>
              <span className="hidden lg:block">
                <CarouselControls index={scroller.index} count={scroller.count} onPrev={scroller.prev} onNext={scroller.next} />
              </span>
            </>
          }
        />
      </Container>

      <Container className="max-lg:px-0">
        <div ref={trackRef} className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 scroll-px-5 scrollbar-none lg:gap-5 lg:px-0 lg:scroll-px-0">
          {SHORTFORMS.map((short) => (
            <article
              key={short.author}
              className="relative h-[266px] w-[150px] shrink-0 snap-start overflow-hidden rounded-[14px] text-white lg:h-[398px] lg:w-[calc((100%-80px)/5)] lg:rounded-lg"
            >
              <img src={short.image} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
              <span aria-hidden className="absolute inset-0 bg-linear-to-b from-black/0 from-35% to-black/55" />

              <img src={play} alt="" className="absolute top-3.5 left-3.5 hidden size-7 lg:block" />
              <p className="absolute top-3 right-2.5 text-11 font-medium lg:top-5 lg:right-3.5 lg:text-12">{short.views}</p>

              <div className="absolute inset-x-2.5 bottom-2.5 flex flex-col gap-2 lg:inset-x-3.5 lg:bottom-3.5 lg:gap-3">
                <p className="text-12 font-semibold lg:text-13">{short.author}</p>
                <a
                  href={productHref(short.product)}
                  className="flex h-13 items-center gap-2 rounded-[10px] bg-white pr-2 pl-1.5 text-main lg:h-auto lg:gap-2.5 lg:rounded-md lg:py-2 lg:pr-3 lg:pl-2"
                >
                  <img src={short.chipImage ?? short.image} alt="" className="size-10 shrink-0 rounded-sm object-cover lg:size-12" />
                  <span className="flex min-w-0 flex-col gap-px lg:gap-0.5">
                    <span className="truncate text-11 lg:text-12">
                      <span className="lg:hidden">{short.shortName}</span>
                      <span className="hidden lg:inline">{short.chipName ?? short.shortName}</span>
                    </span>
                    <span className="text-12 font-semibold tabular-nums lg:text-13">{formatWon(short.product.price)}</span>
                  </span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
