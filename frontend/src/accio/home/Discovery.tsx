import { DISCOVERY, QUICK_CATEGORIES } from '../data/catalog'
import { accioHref } from '../routes'
import { Container, SectionHeader, ViewAllLink } from '../ui/primitives'

/** 모바일 — 5칸 × 2줄 빠른 카테고리 (PC 에서는 GNB·카테고리 메뉴가 대신한다) */
export function QuickCategory() {
  return (
    <nav aria-label="빠른 카테고리" className="grid grid-cols-5 gap-y-4 px-5 pt-8 lg:hidden">
      {QUICK_CATEGORIES.map((item) => (
        <a key={item.label} href={item.href} className="flex flex-col items-center gap-1.5 text-12 font-medium text-main">
          <img src={item.image} alt="" className="size-13 rounded-[18px] object-cover" loading="lazy" />
          {item.label}
        </a>
      ))}
    </nav>
  )
}

/** PC — 오늘의 발견: 큰 타일 2개(사진 위를 흰색으로 흐려 제목) + 브랜드 타일 4개 */
export function TodaysDiscovery() {
  return (
    <section aria-label={DISCOVERY.title} className="hidden pt-24 lg:block">
      <Container className="flex flex-col gap-6">
        <SectionHeader title={DISCOVERY.title} description={DISCOVERY.description} aside={<ViewAllLink href={accioHref('/list')} />} />

        <div className="grid grid-cols-2 gap-6">
          {DISCOVERY.bigTiles.map((tile) => (
            <a key={tile.title} href={accioHref('/list')} className="relative flex h-80 flex-col gap-1.5 overflow-hidden rounded-xl p-8">
              <img src={tile.image} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
              <span aria-hidden className="absolute inset-0 bg-linear-to-b from-white/90 to-white/0 to-60%" />
              <span className="relative text-24 font-semibold text-main">{tile.title}</span>
              <span className="relative text-15 text-sub">{tile.description}</span>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-6">
          {DISCOVERY.brandTiles.map((tile) => (
            <a
              key={tile.brand}
              href={accioHref('/list')}
              className="flex flex-col gap-1 rounded-lg border border-regular bg-white p-5 transition-shadow hover:shadow-accio-2"
            >
              <span className="text-16 font-semibold text-main">{tile.brand}</span>
              <span className="text-13 text-sub-weak">{tile.description}</span>
              <img src={tile.image} alt="" className="mt-3 h-40 w-full rounded-md object-cover" loading="lazy" />
            </a>
          ))}
        </div>
      </Container>
    </section>
  )
}
