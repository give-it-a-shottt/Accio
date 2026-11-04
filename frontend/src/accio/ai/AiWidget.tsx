import close20 from '../assets/v4/icons/close-20-sub.svg'
import expandIcon from '../assets/v4/icons/expand.svg'
import { accioHref } from '../routes'
import { AiDot } from '../ui/primitives'
import useAiChat, { setAiWidgetOpen, useAiWidgetOpen } from '../ui/useAiChat'
import { AiAvatar, AiChip, Composer, MessageList } from './ChatParts'

/**
 * AI 위젯 (Figma PC 423:880 · MO 423:1022) — 지금 보던 화면 위에서 바로 묻는 패널.
 * 결과는 카드 3장만 보여 주고, '전체화면으로 보기'를 누르면 /ai 로 같은 대화가 이어진다.
 */
export default function AiWidget() {
  const isOpen = useAiWidgetOpen()
  const setOpen = setAiWidgetOpen
  const { active, thinking } = useAiChat()
  if (!isOpen) return null

  const expand = () => {
    setOpen(false)
    window.location.hash = accioHref('/ai')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/30 lg:inset-auto lg:right-8 lg:bottom-8 lg:bg-transparent" onClick={() => setOpen(false)}>
      <section
        role="dialog"
        aria-label="Accio AI"
        onClick={(e) => e.stopPropagation()}
        className="flex h-[78svh] w-full animate-[accio-sheet-up_300ms_ease-out] flex-col motion-reduce:animate-none overflow-hidden rounded-t-xl bg-white lg:h-150 lg:w-100 lg:rounded-xl lg:border lg:border-regular lg:shadow-accio-4"
      >
        <span aria-hidden className="mx-auto mt-2 h-1 w-9 rounded-full bg-regular lg:hidden" />
        <header className="flex items-center gap-2 border-b border-light py-3.5 pr-3 pl-4">
          <AiDot size={12} />
          <h2 className="flex-1 text-16 font-semibold text-main">Accio AI</h2>
          <button type="button" onClick={expand} aria-label="전체화면으로 보기">
            <img src={expandIcon} alt="" className="size-5" />
          </button>
          <button type="button" onClick={() => setOpen(false)} aria-label="닫기">
            <img src={close20} alt="" className="size-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-3">
          {active ? (
            <MessageList messages={active.messages} thinking={thinking} variant="widget" onExpand={expand} />
          ) : (
            <div className="flex flex-col items-start gap-3 pt-6">
              <AiAvatar size={56} />
              <p className="text-20 font-semibold text-main">무엇을 찾아드릴까요?</p>
              <p className="text-14 text-sub">보던 화면을 떠나지 않고 바로 물어보세요.</p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {['캠핑 갈 때 쓸 가벼운 의자 찾아줘', '3만원대 집들이 선물 추천해줘', '내 주문 어디까지 왔어?'].map((q) => (
                  <AiChip key={q} label={q} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-3 pt-2 pb-[calc(12px+env(safe-area-inset-bottom))]">
          <Composer placeholder="이어서 물어보세요" size="sm" disabled={thinking} />
        </div>
      </section>
    </div>
  )
}
