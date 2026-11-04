import { useState } from 'react'
import chevronRight from '../assets/v4/icons/chevron-right.svg'
import { EDITOR_PICKS } from '../data/catalog'
import { accioHref } from '../routes'
import ProductCard from '../ui/ProductCard'
import { ArrowButton, Container } from '../ui/primitives'

/** PC — 에디터 픽: 왼쪽 소개 카드 + 상품 3개. 소개 카드의 화살표로 다른 픽으로 넘긴다 */
export default function EditorPick() {
  const [index, setIndex] = useState(0)
  const pick = EDITOR_PICKS[index]
  const move = (step: 1 | -1) => setIndex((i) => (i + step + EDITOR_PICKS.length) % EDITOR_PICKS.length)

  return (
    <section aria-label="에디터 픽" className="hidden pt-24 lg:block">
      <Container className="flex gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-xl bg-light px-7 pt-8 pb-7">
          <p className="text-14 font-semibold text-sub-weak">에디터 픽</p>
          <h2 className="text-28 font-semibold text-main">
            {pick.title[0]}
            <br />
            {pick.title[1]}
          </h2>
          <p className="text-14 text-sub">{pick.description}</p>
          <a href={accioHref('/list')} className="mt-auto flex w-fit items-center gap-0.5 text-14 font-semibold text-main">
            기획전 보기
            <img src={chevronRight} alt="" className="size-4" />
          </a>
          <div className="flex gap-2">
            <ArrowButton direction="prev" onClick={() => move(-1)} />
            <ArrowButton direction="next" onClick={() => move(1)} />
          </div>
        </div>
        {pick.products.map((product) => (
          <ProductCard key={product.id} product={product} className="w-[282px] shrink-0" />
        ))}
      </Container>
    </section>
  )
}
