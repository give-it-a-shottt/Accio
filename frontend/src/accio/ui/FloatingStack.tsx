import arrowUp from '../assets/v4/icons/arrow-up.svg'
import AiWidget from '../ai/AiWidget'
import { openAiWidget } from './useAiChat'
import { AiDot } from './primitives'

/** PC 오른쪽 아래에 떠 있는 '맨 위로' + 'AI에게 물어보기'(누르면 AI 위젯이 열린다) */
export default function FloatingStack() {
  return (
    <>
      <div className="fixed right-10 bottom-10 z-40 hidden flex-col items-end gap-2.5 lg:flex">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="맨 위로"
          className="flex size-11 items-center justify-center rounded-full border border-regular bg-white shadow-accio-2"
        >
          <img src={arrowUp} alt="" className="size-4" />
        </button>
        <button
          type="button"
          onClick={openAiWidget}
          className="flex h-13 items-center gap-1.5 rounded-full border border-regular bg-white pr-5 pl-[18px] text-14 font-semibold text-main shadow-accio-3"
        >
          <AiDot size={12.6} />
          AI에게 물어보기
        </button>
      </div>
      <AiWidget />
    </>
  )
}
