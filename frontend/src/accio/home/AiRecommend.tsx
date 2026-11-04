import { useState } from 'react'
import { RECOMMEND, RECOMMEND_CATEGORIES, RECOMMENDED } from '../data/catalog'
import useMediaQuery from '../hooks/useMediaQuery'
import ProductCard from '../ui/ProductCard'
import { AiDot, Button, Container } from '../ui/primitives'

type CategoryLabel = (typeof RECOMMEND_CATEGORIES)[number]['label']

/**
 * AI 개인 추천 — 최근 본 상품을 바탕으로 고른 상품. 분야를 고르면 거르고, '더보기'로 한 묶음씩 더 연다.
 * PC 는 동그란 사진 탭 + 4열(한 묶음 12개), 모바일은 칩 탭 + 2열(한 묶음 6개).
 */
export default function AiRecommend() {
  const isPc = useMediaQuery('(min-width: 1024px)')
  const pageSize = isPc ? 12 : 6
  const [category, setCategory] = useState<CategoryLabel>('전체')
  const [pages, setPages] = useState(1)

  const filtered = category === '전체' ? RECOMMENDED : RECOMMENDED.filter((p) => p.category === category)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice(0, pages * pageSize)

  const choose = (label: CategoryLabel) => {
    setCategory(label)
    setPages(1)
  }

  return (
    <section aria-labelledby="ai-recommend-title" className="pt-10 lg:pt-18">
      <Container className="flex flex-col gap-4 lg:gap-6">
        <div className="flex flex-col gap-1.5 lg:gap-2">
          <p className="flex items-center gap-[5px] text-12 font-semibold text-sub lg:gap-1.5 lg:text-14">
            <AiDot size={isPc ? 9.8 : 10} />
            {RECOMMEND.label}
          </p>
          <h2 id="ai-recommend-title" className="text-20 font-semibold text-main lg:text-28">
            {RECOMMEND.title}
          </h2>
          <p className="flex flex-wrap items-center gap-1 text-12 text-sub-weak lg:gap-1.5 lg:text-14">
            최근 본
            <span className="rounded-xs bg-regular px-1.5 py-px text-12 font-medium text-main lg:px-2 lg:py-0.5 lg:text-13">
              {RECOMMEND.recentKeywords[0]}
            </span>
            <span className="hidden lg:contents">
              ·
              <span className="rounded-xs bg-regular px-2 py-0.5 text-13 font-medium text-main">{RECOMMEND.recentKeywords[1]}</span>
              를 바탕으로 추천해요
            </span>
            <span className="lg:hidden">기반 추천</span>
          </p>
        </div>

        {/* 분야 탭 — PC 는 동그란 사진, 모바일은 가로로 미는 칩 */}
        <div role="tablist" aria-label="추천 분야" className="-mx-5 flex gap-1.5 overflow-x-auto px-5 scrollbar-none lg:mx-0 lg:justify-between lg:gap-0 lg:overflow-visible lg:px-0 lg:py-2">
          {RECOMMEND_CATEGORIES.map((item) => {
            const isSelected = item.label === category
            return (
              <button
                key={item.label}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => choose(item.label)}
                className="group flex shrink-0 flex-col items-center gap-2"
              >
                <span
                  className={`rounded-full px-3 py-1.5 text-13 whitespace-nowrap lg:hidden ${isSelected ? 'bg-main font-semibold text-white' : 'bg-light font-medium text-sub'}`}
                >
                  {item.label}
                </span>
                <span
                  className={`hidden size-16 items-center justify-center overflow-hidden rounded-full lg:flex ${
                    item.image ? (isSelected ? 'ring-2 ring-black ring-offset-2' : '') : isSelected ? 'bg-main text-white' : 'bg-regular text-sub'
                  }`}
                >
                  {item.image ? (
                    <img src={item.image} alt="" className="size-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-14 font-semibold">ALL</span>
                  )}
                </span>
                <span className={`hidden text-13 lg:block ${isSelected ? 'font-semibold text-main' : 'text-sub'}`}>{item.label}</span>
              </button>
            )
          })}
        </div>

        {visible.length > 0 ? (
          <div role="tabpanel" aria-label={category} className="grid grid-cols-2 gap-x-3 gap-y-4 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} showAiBadge />
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-light py-12 text-center text-14 text-sub">
            {category} 분야는 아직 추천할 상품이 없어요. 다른 분야를 골라 보세요.
          </p>
        )}

        {pages < totalPages && (
          <div className="flex justify-center lg:pt-4">
            <Button onClick={() => setPages((p) => p + 1)} className="w-full lg:w-90">
              추천 상품 더보기
              <span className="hidden lg:inline">
                &nbsp;({pages}/{totalPages})
              </span>
            </Button>
          </div>
        )}
      </Container>
    </section>
  )
}
