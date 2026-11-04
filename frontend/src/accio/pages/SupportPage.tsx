import { useState } from 'react'
import chevronDown from '../assets/v4/icons/chevron-down.svg'
import chevronRight from '../assets/v4/icons/chevron-right.svg'
import searchSub from '../assets/v4/icons/search-sub.svg'
import { accioHref } from '../routes'
import Modal from '../ui/Modal'
import { AiDot, Button, Container, TextField } from '../ui/primitives'
import SiteFooter from '../ui/SiteFooter'
import SiteHeader from '../ui/SiteHeader'

const CATEGORIES = ['전체', '주문·결제', '배송', '반품·교환', '환불', '회원'] as const
type Category = (typeof CATEGORIES)[number]

const FAQ: { category: Exclude<Category, '전체'>; q: string; a: string }[] = [
  { category: '배송', q: '주문한 상품은 언제 도착하나요?', a: '결제 후 평균 1~2일 안에 도착해요. 주문내역 > 배송조회에서 실시간 위치를 볼 수 있어요. 도서산간 지역은 1~2일 더 걸릴 수 있어요.' },
  { category: '주문·결제', q: '결제 수단을 바꾸고 싶어요', a: '결제완료 상태에서는 주문을 취소한 뒤 다른 수단으로 다시 주문해 주세요. 배송이 시작된 뒤에는 바꿀 수 없어요.' },
  { category: '반품·교환', q: '반품 배송비는 누가 내나요?', a: '상품 불량·오배송은 Accio가 내요. 단순 변심은 왕복 배송비 6,000원이 환불 금액에서 빠져요.' },
  { category: '환불', q: '환불은 언제 되나요?', a: '반품 상품이 도착해 검수가 끝나면 1~3영업일 안에 결제 수단으로 돌려드려요. 카드는 카드사 사정에 따라 3~5일 더 걸릴 수 있어요.' },
  { category: '회원', q: '비밀번호를 잊어버렸어요', a: '로그인 화면의 ‘비밀번호 찾기’에서 가입한 이메일로 재설정 링크를 받을 수 있어요. 5회 틀리면 30초 동안 잠겨요.' },
  { category: '주문·결제', q: '주문을 취소하고 싶어요', a: '결제완료 상태라면 주문내역에서 바로 취소할 수 있어요. 배송이 시작됐다면 받은 뒤 반품 신청을 해 주세요.' },
  { category: '배송', q: '배송지를 바꿀 수 있나요?', a: '결제완료·배송준비 상태에서는 고객센터 1:1 문의로 바꿀 수 있어요. 배송이 시작되면 택배사에 직접 요청해 주세요.' },
  { category: '반품·교환', q: '교환은 어떻게 하나요?', a: '같은 상품의 다른 옵션으로 교환하려면 반품 신청 후 원하는 옵션으로 다시 주문해 주세요. 불량이면 반품 배송비가 없어요.' },
  { category: '회원', q: 'AI 추천이 더 정확해지려면 어떻게 하나요?', a: '로그인한 상태로 상품을 보고 찜하면 취향이 쌓여요. 마이페이지 > 최근 본 상품에서 기록을 지울 수도 있어요.' },
]

/** 1:1 문의 — 목업이라 보내면 접수됐다는 안내만 띄운다 */
function InquiryModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const valid = title.trim().length > 0 && body.trim().length >= 10
  return (
    <Modal
      title="1:1 문의"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} className="flex-1">
            닫기
          </Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() => {
              onSent()
              onClose()
            }}
            className="flex-1"
          >
            문의 남기기
          </Button>
        </>
      }
    >
      <TextField id="inquiry-title" label="제목" placeholder="예) 배송지를 바꾸고 싶어요" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="inquiry-body" className="text-14 font-medium text-main">
          내용
        </label>
        <textarea
          id="inquiry-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="주문번호와 함께 자세히 적어 주세요 (10자 이상)"
          className="h-28 resize-none rounded-md border border-regular px-4 py-3 text-14 text-main outline-none placeholder:text-disabled focus:border-[1.5px] focus:border-black"
        />
        <p className="text-12 text-sub-weak">답변은 평일 기준 1일 안에 이메일로 드려요.</p>
      </div>
    </Modal>
  )
}

/** 고객센터 (Figma PC 430:2946 · MO 430:3152) — 자주 묻는 질문 검색·분류·펼치기 + 상담 창구 */
export default function SupportPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category>('전체')
  const [open, setOpen] = useState<number | null>(0)
  const [inquiry, setInquiry] = useState(false)
  const [sent, setSent] = useState(false)

  const q = query.trim()
  const list = FAQ.map((item, index) => ({ ...item, index })).filter(
    (item) => (category === '전체' || item.category === category) && (!q || item.q.includes(q) || item.a.includes(q)),
  )

  const channels = [
    { title: 'AI 상담', ai: true, description: '주문·배송·반품은 AI가 바로 답해요 (24시간)', action: 'AI에게 물어보기', onClick: () => (window.location.hash = accioHref('/ai')) },
    { title: '1:1 문의', description: '답변까지 평일 기준 1일', action: '문의하기', onClick: () => setInquiry(true) },
    { title: '전화 상담', description: '1577-0000 · 평일 09:00–18:00' },
  ]

  return (
    <div className="min-h-svh bg-white">
      <SiteHeader mobileTitle="고객센터" />
      <main>
        <Container className="flex flex-col gap-5 pt-4 pb-30 lg:gap-6 lg:pt-12">
          <div className="flex flex-col gap-1">
            <h1 className="text-24 font-semibold text-main lg:text-32">무엇을 도와드릴까요?</h1>
            <p className="hidden text-14 text-sub lg:block">자주 묻는 질문에서 먼저 찾아보세요</p>
          </div>

          <form role="search" onSubmit={(e) => e.preventDefault()} className="flex h-12 items-center gap-2 rounded-full bg-light pr-4 pl-5 lg:h-13">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="궁금한 걸 검색해 보세요"
              aria-label="자주 묻는 질문 검색"
              className="min-w-0 flex-1 bg-transparent text-15 text-main outline-none placeholder:text-disabled"
            />
            <img src={searchSub} alt="" className="size-6" />
          </form>

          <div role="tablist" aria-label="질문 분류" className="-mx-5 flex gap-1.5 overflow-x-auto px-5 scrollbar-none lg:mx-0 lg:px-0">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={c === category}
                onClick={() => setCategory(c)}
                className={`shrink-0 rounded-full px-3.5 py-[7px] text-13 ${c === category ? 'bg-main font-semibold text-white' : 'border border-regular font-medium text-sub'}`}
              >
                {c}
              </button>
            ))}
          </div>

          <ul className="flex flex-col">
            {list.length === 0 && <li className="rounded-lg bg-light py-12 text-center text-14 text-sub">‘{q}’에 맞는 질문이 없어요. 아래 상담 창구로 물어보세요.</li>}
            {list.map((item) => {
              const isOpen = open === item.index
              return (
                <li key={item.q} className="border-b border-light">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : item.index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-2 py-4 text-left lg:py-3.5"
                  >
                    <span className="text-15 font-semibold text-main">Q</span>
                    <span className="hidden text-11 text-sub-weak lg:inline">{item.category}</span>
                    <span className={`min-w-0 flex-1 text-15 text-main lg:text-14 ${isOpen ? 'font-semibold' : 'font-medium'}`}>{item.q}</span>
                    <img src={chevronDown} alt="" className={`size-5 transition-transform lg:size-4 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <p className="mb-4 flex gap-2 rounded-md bg-light px-4 py-3 text-14 text-sub lg:text-13">
                      <span className="font-semibold text-sub-weak">A</span>
                      {item.a}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>

          <section aria-label="상담 창구" className="flex flex-col gap-4 lg:pt-8">
            <h2 className="hidden text-18 font-semibold text-main lg:block">원하는 답을 못 찾았나요?</h2>
            <div className="grid gap-3 lg:grid-cols-3">
              {channels.map((c) => (
                <div key={c.title} className="flex flex-col gap-1.5 rounded-lg border border-regular px-5 py-4">
                  <p className="flex items-center gap-1.5 text-16 font-semibold text-main">
                    {c.ai && <AiDot size={12} />}
                    {c.title}
                  </p>
                  <p className="text-13 text-sub-weak">{c.description}</p>
                  {c.action && (
                    <button type="button" onClick={c.onClick} className="flex w-fit items-center gap-0.5 pt-1 text-14 font-semibold text-main">
                      {c.action}
                      <img src={chevronRight} alt="" className="size-4" />
                    </button>
                  )}
                  {!c.action && (
                    <a href="tel:15770000" className="w-fit pt-1 text-14 font-semibold text-main lg:hidden">
                      전화 걸기
                    </a>
                  )}
                </div>
              ))}
            </div>
            {sent && <p role="status" className="rounded-md bg-status-success-soft px-4 py-3 text-14 text-status-success">문의를 남겼어요. 평일 기준 1일 안에 이메일로 답변드릴게요.</p>}
          </section>
        </Container>
      </main>
      <SiteFooter hideOnMobile />
      {inquiry && <InquiryModal onClose={() => setInquiry(false)} onSent={() => setSent(true)} />}
    </div>
  )
}
