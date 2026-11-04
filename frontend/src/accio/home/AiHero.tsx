import { useState, type FormEvent } from 'react'
import sendDisabled from '../assets/v4/icons/send-disabled.svg'
import send from '../assets/v4/icons/send.svg'
import { AI_HERO } from '../data/catalog'
import { accioHref } from '../routes'
import useMediaQuery from '../hooks/useMediaQuery'
import { AiDot } from '../ui/primitives'

function ask(question: string) {
  const q = question.trim()
  if (q) window.location.hash = `${accioHref('/ai')}?q=${encodeURIComponent(q)}`
}

/** AI 추천 질문 칩 — 누르면 바로 질문을 보낸다 */
function AiChip({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => ask(label)}
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-regular bg-white px-4 py-2 text-14 font-medium whitespace-nowrap text-main hover:border-accio"
    >
      <AiDot size={9.8} />
      {label}
    </button>
  )
}

/**
 * 홈 맨 위 AI 자연어 검색. PC 는 가운데 정렬 큰 제목 + 64 높이 검색바, 모바일은 왼쪽 정렬 + 52.
 * 모바일 검색바는 비어 있으면 회색, 포커스하면 오렌지 테두리. PC 는 늘 포커스된 모습(오렌지 테두리 + Shadow/3)으로 둔다.
 */
export default function AiHero() {
  const [question, setQuestion] = useState('')
  const isPc = useMediaQuery('(min-width: 1024px)')
  // PC 는 예시 질문을 진하게 보여 주고 빈 채로 보내면 그 예시를 묻는다. 모바일은 입력해야 보내기가 켜진다
  const canSend = isPc || question.trim().length > 0
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    ask(question.trim() || (isPc ? AI_HERO.placeholder.pc : ''))
  }

  return (
    <section aria-labelledby="ai-hero-title" className="bg-light px-5 pt-8 pb-7 lg:pt-18 lg:pb-16">
      <div className="mx-auto flex w-full max-w-[792px] flex-col gap-2.5 lg:items-center lg:gap-4">
        <p className="flex w-fit items-center gap-[5px] text-12 font-semibold text-sub lg:gap-1.5 lg:rounded-full lg:border lg:border-regular lg:bg-white lg:px-3 lg:py-1.5 lg:text-13">
          <AiDot size={isPc ? 8.4 : 10} />
          {AI_HERO.badge}
        </p>
        <h1 id="ai-hero-title" className="text-24 font-semibold text-main lg:text-40">
          {AI_HERO.title}
        </h1>
        <p className="hidden text-18 text-sub lg:block">{AI_HERO.description}</p>

        <form
          onSubmit={onSubmit}
          className="mt-1.5 flex h-13 w-full items-center gap-3 rounded-full border border-regular bg-white pr-2 pl-5 shadow-accio-1 focus-within:border-[1.5px] focus-within:border-accio focus-within:shadow-accio-3 lg:mt-3 lg:h-16 lg:border-[1.5px] lg:border-accio lg:shadow-accio-3"
        >
          <AiDot size={14} />
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={isPc ? AI_HERO.placeholder.pc : AI_HERO.placeholder.mo}
            aria-label="AI에게 원하는 상품 설명하기"
            className="min-w-0 flex-1 bg-transparent text-15 text-main outline-none placeholder:text-disabled lg:placeholder:text-sub"
          />
          <button type="submit" disabled={!canSend} aria-label="AI 검색 보내기" className="shrink-0">
            <img src={canSend ? send : sendDisabled} alt="" className="size-10" />
          </button>
        </form>

        {/* 모바일은 칩이 넘치면 가로로 민다 */}
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 scrollbar-none lg:mx-0 lg:flex-wrap lg:justify-center lg:overflow-visible lg:px-0 lg:pt-2">
          {AI_HERO.chips.map((chip) => (
            <AiChip key={chip} label={chip} />
          ))}
        </div>
      </div>
    </section>
  )
}
