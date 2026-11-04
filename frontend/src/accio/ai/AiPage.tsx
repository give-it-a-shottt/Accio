import { useEffect, useMemo, useRef, useState } from 'react'
import backIcon from '../assets/v4/icons/back.svg'
import chatIcon from '../assets/v4/icons/chat.svg'
import expandIcon from '../assets/v4/icons/expand.svg'
import plus20 from '../assets/v4/icons/plus-20.svg'
import { STARTERS, type AiReply } from '../data/aiEngine'
import { productHref } from '../data/catalog'
import { accioHref } from '../routes'
import { AiDot, Button, CheckMark, Logo } from '../ui/primitives'
import useAiChat, { chatActions, type Conversation } from '../ui/useAiChat'
import { cartActions } from '../ui/useCart'
import { formatCount, formatWon } from '../utils/format'
import { AiAvatar, AiChip, Composer, MessageList } from './ChatParts'

const DAY = 24 * 60 * 60 * 1000

/** 오늘 / 지난 7일 / 이전 으로 묶는다 */
function groupByDate(conversations: Conversation[]) {
  const now = Date.now()
  const startOfToday = new Date().setHours(0, 0, 0, 0)
  const groups: { label: string; items: Conversation[] }[] = [
    { label: '오늘', items: [] },
    { label: '지난 7일', items: [] },
    { label: '이전', items: [] },
  ]
  ;[...conversations]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .forEach((c) => groups[c.updatedAt >= startOfToday ? 0 : now - c.updatedAt < 7 * DAY ? 1 : 2].items.push(c))
  return groups.filter((g) => g.items.length > 0)
}

const ask = (question: string, label: string) => (label === '이미지로 찾기' ? chatActions.sendImage(1) : chatActions.send(question))

/** PC 왼쪽 대화 기록 */
function HistorySidebar({ conversations, activeId }: { conversations: Conversation[]; activeId: string | null }) {
  return (
    <aside className="hidden h-svh w-65 shrink-0 flex-col gap-5 overflow-y-auto bg-light px-5 py-6 lg:flex">
      <Logo height={30.96} />
      <button
        type="button"
        onClick={chatActions.startNew}
        className="flex items-center gap-1.5 rounded-md border border-regular bg-white px-3.5 py-2.5 text-14 font-semibold text-main"
      >
        <img src={plus20} alt="" className="size-5" />새 대화
      </button>
      {groupByDate(conversations).map((group) => (
        <nav key={group.label} aria-label={group.label} className="flex flex-col gap-1">
          <p className="text-12 font-medium text-sub-weak">{group.label}</p>
          {group.items.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => chatActions.open(c.id)}
              aria-current={c.id === activeId ? 'true' : undefined}
              className={`flex items-center gap-2 rounded-sm px-2.5 py-2 text-left text-14 ${c.id === activeId ? 'bg-regular text-main' : 'text-sub hover:bg-regular/60'}`}
            >
              <img src={chatIcon} alt="" className="size-4.5 shrink-0" />
              <span className="truncate">{c.title}</span>
            </button>
          ))}
        </nav>
      ))}
      <a href={accioHref()} className="mt-auto text-14 font-medium text-sub">
        ← 쇼핑 홈으로
      </a>
    </aside>
  )
}

/** PC 오른쪽 결과 패널 — 탭(묶음)별 목록, 체크한 상품을 한 번에 담는다 */
function ResultPanel({ result }: { result: NonNullable<AiReply['result']> }) {
  const [tab, setTab] = useState(0)
  // 처음에는 묶음마다 1위를 골라 둔다 (시안: '재료별 1위 5개 선택됨')
  const [selected, setSelected] = useState<string[]>(() => result.groups.map((g) => g.products[0]?.id).filter(Boolean))
  const [added, setAdded] = useState(false)
  const group = result.groups[Math.min(tab, result.groups.length - 1)]
  const all = result.groups.flatMap((g) => g.products)
  const picked = all.filter((p, i) => selected.includes(p.id) && all.findIndex((q) => q.id === p.id) === i)
  const total = picked.reduce((sum, p) => sum + p.price, 0)
  const toggle = (id: string) => setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
  const isTopPicks = result.groups.length > 1 && picked.length === result.groups.length && result.groups.every((g) => selected.includes(g.products[0].id))

  return (
    <section aria-label={result.title} className="flex h-svh min-w-0 flex-1 flex-col gap-4 bg-light pt-6">
      <div className="flex items-center justify-between px-8">
        <h2 className="flex items-center gap-2 text-18 font-semibold text-main">
          {result.title}
          {result.badge && <span className="rounded-full bg-white px-2 py-0.5 text-12 font-semibold text-sub">{result.badge}</span>}
        </h2>
        <a href={accioHref('/list')} aria-label="목록 화면에서 크게 보기">
          <img src={expandIcon} alt="" className="size-5" />
        </a>
      </div>

      {result.groups.length > 1 && (
        <div className="flex flex-wrap gap-1.5 px-8">
          {result.groups.map((g, i) => (
            <button
              key={g.label}
              type="button"
              onClick={() => setTab(i)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-14 ${i === tab ? 'bg-main font-semibold text-white' : 'border border-regular bg-white font-medium text-sub'}`}
            >
              {g.label}
              <span className={`text-12 ${i === tab ? 'font-medium' : ''} text-disabled`}>{g.products.length}</span>
            </button>
          ))}
        </div>
      )}

      <ul className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-8 pb-4">
        {group.products.map((p, i) => {
          const checked = selected.includes(p.id)
          return (
            <li key={p.id}>
              <label className={`flex cursor-pointer items-center gap-3.5 rounded-[14px] bg-white px-4 py-3 ${checked ? 'border-[1.5px] border-black' : 'border-[1.5px] border-transparent'}`}>
                <input type="checkbox" checked={checked} onChange={() => toggle(p.id)} className="sr-only" />
                <CheckMark checked={checked} />
                <img src={p.image} alt="" className="size-16 rounded-[10px] object-cover" />
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  {i === 0 && (
                    <span className="flex w-fit items-center gap-[3px] rounded-xs bg-accio-soft px-1.5 py-0.5 text-11 font-semibold text-accio-strong">
                      <AiDot size={8} />
                      AI 추천 · 판매 1위
                    </span>
                  )}
                  <a href={productHref(p)} className="truncate text-14 text-main hover:underline">
                    {p.fullName ?? p.name}
                  </a>
                  <span className="text-12 text-sub-weak tabular-nums">
                    ★ {p.rating.toFixed(1)} ({formatCount(p.reviewCount)})
                  </span>
                </span>
                <span className="text-16 font-semibold text-main tabular-nums">{formatWon(p.price)}</span>
              </label>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center gap-4 border-t border-regular bg-white px-8 py-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-14 font-medium text-sub">
            {added ? '장바구니에 담았어요' : isTopPicks ? `재료별 1위 ${picked.length}개 선택됨` : `${picked.length}개 선택됨`}
          </p>
          <p className="text-24 font-semibold text-main tabular-nums">{formatWon(total)}</p>
        </div>
        {added ? (
          <a href={accioHref('/cart')} className="flex h-12 w-55 items-center justify-center rounded-md border border-regular bg-white text-16 font-semibold text-main">
            장바구니 보기
          </a>
        ) : (
          <Button
            variant="primary"
            disabled={picked.length === 0}
            onClick={() => {
              picked.forEach((p) => cartActions.add(p, '기본', 1))
              setAdded(true)
            }}
            className="w-55"
          >
            {picked.length}개 장바구니 담기
          </Button>
        )}
      </div>
    </section>
  )
}

/** 첫 화면 — 큰 질문 + 입력창 + 예시 카드 */
function Welcome() {
  return (
    <div className="flex flex-1 flex-col gap-3 px-5 pt-10 pb-6 lg:items-center lg:justify-center lg:gap-5 lg:p-0">
      <AiAvatar size={56} />
      <h1 className="text-28 font-semibold text-main lg:text-32">
        무엇을
        <br className="lg:hidden" /> 찾아드릴까요?
      </h1>
      <p className="text-15 text-sub lg:text-18">상품 찾기부터 주문 조회, 재구매까지 말로 해 보세요</p>
      <div className="hidden w-180 lg:block">
        <Composer placeholder="예) 캠핑 갈 때 쓸 가벼운 의자 찾아줘" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 lg:mt-3 lg:grid-cols-3">
        {STARTERS.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => ask(s.question, s.label)}
            className={`flex flex-col gap-1.5 rounded-[14px] px-4 py-3.5 text-left lg:w-58 lg:border lg:border-regular lg:bg-white lg:px-4.5 lg:py-4 lg:hover:border-accio ${i === 5 ? 'hidden lg:flex' : 'bg-light'}`}
          >
            <span className="text-12 font-medium text-sub-weak lg:font-semibold">{s.label}</span>
            <span className="text-15 font-medium text-main lg:text-14">{s.question}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * AI 검색 (Figma PC 422:850 · 첫 화면 422:1014 · MO 422:1083 · 422:1167).
 * PC 는 대화 기록 | 대화 | 결과 패널 3단, 모바일은 대화 안에 결과를 그린다. 공통 헤더는 숨긴다.
 * '#/ai?q=…' 로 들어오면 그 질문으로 새 대화를 시작한다.
 */
export default function AiPage({ initialQuestion, resume }: { initialQuestion?: string; resume?: string }) {
  const { conversations, activeId, active, thinking, streamingId, latestResult } = useAiChat()

  // 개발 모드(StrictMode)에서 효과가 두 번 돌아도 질문은 한 번만 보낸다
  const handled = useRef<string>(undefined)
  useEffect(() => {
    const question = resume ?? initialQuestion
    if (!question || handled.current === question) return
    handled.current = question
    // 로그인하고 돌아온 질문(resume)은 하던 대화에 이어서, 새 질문(q)은 새 대화로 묻는다
    if (!resume) chatActions.startNew()
    chatActions.send(question)
    // 질문은 주소에서 지워 새로고침해도 다시 보내지 않게 한다
    window.history.replaceState(null, '', accioHref('/ai'))
  }, [initialQuestion, resume])

  // 결과가 바뀌면 패널 선택을 새로 시작하도록 key 로 쓴다
  const resultKey = useMemo(() => {
    const message = [...(active?.messages ?? [])].reverse().find((m) => m.role === 'ai' && m.reply.result)
    return message?.id ?? 'none'
  }, [active])
  const lastReply = [...(active?.messages ?? [])].reverse().find((m) => m.role === 'ai')

  return (
    <div className="flex h-svh bg-white">
      <HistorySidebar conversations={conversations} activeId={activeId} />

      <main className={`flex h-svh min-w-0 flex-col lg:border-r lg:border-light ${active ? 'flex-1 lg:w-135 lg:flex-none' : 'flex-1'}`}>
        {/* 모바일 상단바 */}
        <div className="flex items-center gap-2 border-b border-light py-2.5 pr-4 pl-3 lg:hidden">
          <a href={accioHref()} aria-label="쇼핑 홈으로">
            <img src={backIcon} alt="" className="size-6" />
          </a>
          <p className="flex flex-1 items-center gap-1.5 text-18 font-semibold text-main">
            <AiDot size={12} />
            AI 검색
          </p>
          <button type="button" onClick={chatActions.startNew} aria-label="새 대화">
            <img src={plus20} alt="" className="size-5" />
          </button>
        </div>

        {active ? (
          <>
            <div className="hidden items-center justify-between px-7 pt-5 pb-4 lg:flex">
              <h1 className="truncate text-16 font-semibold text-main">{active.title}</h1>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className="text-13 font-medium text-sub-weak hover:text-main"
              >
                공유
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-4 lg:px-7 lg:pt-3">
              <div className="lg:hidden">
                <MessageList messages={active.messages} thinking={thinking} variant="mobile" />
              </div>
              <div className="hidden lg:block">
                <MessageList messages={active.messages} thinking={thinking} variant="page" />
              </div>
            </div>
            <div className="flex flex-col gap-2 px-4 pt-2 pb-[calc(16px+env(safe-area-inset-bottom))] lg:items-center lg:px-7 lg:pt-3 lg:pb-5">
              {lastReply?.role === 'ai' && lastReply.reply.chips && !thinking && !streamingId && (
                <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-none lg:hidden">
                  {lastReply.reply.chips.map((chip) => (
                    <AiChip key={chip} label={chip} />
                  ))}
                </div>
              )}
              <div className="w-full lg:hidden">
                <Composer placeholder="이어서 물어보세요" size="md" disabled={thinking} />
              </div>
              <div className="hidden w-full lg:block">
                <Composer placeholder="이어서 물어보세요 (예: 더 싼 거, 다른 브랜드)" disabled={thinking} />
              </div>
              <p className="hidden text-12 text-sub-weak lg:block">AI 답변은 틀릴 수 있어요. 가격·재고는 상품 페이지에서 확인하세요.</p>
            </div>
          </>
        ) : (
          <>
            <Welcome />
            <div className="px-4 pb-[calc(16px+env(safe-area-inset-bottom))] lg:hidden">
              <Composer placeholder="무엇이든 물어보세요" size="md" />
            </div>
          </>
        )}
      </main>

      {active && (
        <div className="hidden min-w-0 flex-1 lg:flex">
          {latestResult ? (
            <ResultPanel key={resultKey} result={latestResult} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-light text-center">
              <p className="text-16 font-semibold text-main">찾은 상품이 여기에 모여요</p>
              <p className="text-14 text-sub">왼쪽에서 원하는 걸 말로 물어보세요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
