import { useState } from 'react'
import { FEATURED_BRANDS, productHref } from '../data/catalog'
import { accioHref } from '../routes'
import { ArrowButton, Container, SectionHeader, ViewAllLink } from '../ui/primitives'
import { formatWon } from '../utils/format'

/**
 * 주목해야 할 브랜드 — 브랜드 칩을 고르면 큰 배너와 아래 대표 상품 3개가 바뀐다.
 * PC 배너 1200×420(오른쪽 520 사진, 양옆 화살표, 아래 점), 모바일 350×240(오른쪽 170 사진, '1 / 7' 표시).
 */
export default function FeaturedBrand() {
  const [selected, setSelected] = useState(0)
  const brand = FEATURED_BRANDS[selected]
  const count = FEATURED_BRANDS.length
  const move = (step: 1 | -1) => setSelected((i) => (i + step + count) % count)

  return (
    <section aria-label="주목해야 할 브랜드" className="flex flex-col gap-3.5 pt-12 lg:items-center lg:gap-6 lg:pt-24">
      <Container className="lg:hidden">
        <SectionHeader title="주목해야 할 브랜드" aside={<ViewAllLink href={accioHref('/list')} />} />
      </Container>
      <h2 className="hidden text-24 font-semibold text-main lg:block">주목해야 할 브랜드</h2>

      <div role="tablist" aria-label="브랜드" className="flex gap-1.5 overflow-x-auto px-5 scrollbar-none lg:gap-2 lg:px-0">
        {FEATURED_BRANDS.map((item, i) => {
          const isSelected = i === selected
          return (
            <button
              key={item.name}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelected(i)}
              className={`shrink-0 rounded-full px-3.5 py-[7px] text-13 whitespace-nowrap lg:px-4 lg:py-2 lg:text-14 ${
                isSelected ? 'bg-main font-semibold text-white' : 'border border-regular bg-white font-medium text-sub'
              }`}
            >
              {item.name}
            </button>
          )
        })}
      </div>

      <Container className="flex flex-col gap-4 lg:gap-6">
        <div role="tabpanel" aria-label={brand.name} className="relative h-60 overflow-hidden rounded-lg bg-[#e7e4df] lg:h-105 lg:rounded-xl">
          <img
            src={brand.image}
            alt=""
            className="absolute inset-y-0 right-0 h-full w-[170px] object-cover lg:w-[520px]"
          />
          <div className="absolute top-18 left-5 flex flex-col gap-1.5 lg:top-30 lg:left-18 lg:gap-2.5">
            <p className="text-12 font-semibold text-sub lg:text-14">{brand.english}</p>
            <p className="text-24 font-semibold text-main lg:text-40">
              <span className="lg:hidden">
                {brand.shortTitle[0]}
                <br />
                {brand.shortTitle[1]}
              </span>
              <span className="hidden lg:inline">
                {brand.title[0]}
                <br />
                {brand.title[1]}
              </span>
            </p>
            <p className="text-13 text-sub lg:text-18">
              <span className="lg:hidden">{brand.shortDescription}</span>
              <span className="hidden lg:inline">{brand.description}</span>
            </p>
          </div>

          <p className="absolute right-5 bottom-3.5 rounded-full bg-black/35 px-2 py-[3px] text-11 font-medium text-white tabular-nums lg:hidden">
            {selected + 1} / {count}
          </p>

          <ArrowButton direction="prev" size={44} floating onClick={() => move(-1)} className="absolute top-1/2 left-5 hidden -translate-y-1/2 lg:flex" />
          <ArrowButton direction="next" size={44} floating onClick={() => move(1)} className="absolute top-1/2 right-5 hidden -translate-y-1/2 lg:flex" />

          <div className="absolute bottom-[22px] left-18 hidden items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1.5 lg:flex">
            {FEATURED_BRANDS.map((item, i) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setSelected(i)}
                aria-label={`${item.name} 배너 보기`}
                className={`h-1.5 rounded-[3px] transition-all ${i === selected ? 'w-[18px] bg-black' : 'w-1.5 bg-icon-disabled'}`}
              />
            ))}
          </div>
        </div>

        <ul className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-6">
          {brand.products.map((product) => (
            <li key={product.id}>
              <a href={productHref(product)} className="flex items-center gap-3 lg:gap-4">
                <img src={product.image} alt="" className="size-16 shrink-0 rounded-[10px] object-cover lg:size-22 lg:rounded-md" loading="lazy" />
                <span className="flex min-w-0 flex-col gap-0.5 lg:gap-1">
                  <span className="hidden text-12 font-medium text-sub-weak lg:block">{product.brand}</span>
                  <span className="truncate text-13 text-main lg:text-14">{product.name}</span>
                  <span className="text-15 font-semibold text-main tabular-nums lg:text-16">{formatWon(product.price)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
