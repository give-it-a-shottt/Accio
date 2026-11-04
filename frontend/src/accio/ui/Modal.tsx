import { useEffect, type ReactNode } from 'react'
import close24 from '../assets/v4/icons/close-24.svg'

/**
 * 디자인 시스템 모달 — PC 는 가운데 480 · radius 20 · Shadow/4, 모바일은 아래에서 올라오는 시트.
 * Esc 와 바깥 누르기로 닫힌다.
 */
export default function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgb(18_18_23/0.45)] lg:items-center" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90svh] w-full animate-[accio-sheet-up_300ms_ease-out] flex-col gap-5 overflow-y-auto rounded-t-xl bg-white px-5 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-accio-4 motion-reduce:animate-none lg:w-120 lg:rounded-xl lg:px-7 lg:py-6"
      >
        <span aria-hidden className="mx-auto h-1 w-9 shrink-0 rounded-full bg-regular lg:hidden" />
        <header className="flex items-center justify-between">
          <h2 className="text-20 font-semibold text-main">{title}</h2>
          <button type="button" onClick={onClose} aria-label="닫기">
            <img src={close24} alt="" className="size-6" />
          </button>
        </header>
        <div className="flex flex-col gap-4">{children}</div>
        {footer && <div className="flex gap-2">{footer}</div>}
      </section>
    </div>
  )
}

/** 디자인 시스템 Radio — 켜짐은 검은 굵은 테두리, 꺼짐은 회색 */
export function RadioRow({ checked, onChange, label, name }: { checked: boolean; onChange: () => void; label: string; name: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-3">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span aria-hidden className={`size-5 shrink-0 rounded-full bg-white ${checked ? 'border-6 border-black' : 'border-[1.5px] border-regular'}`} />
      <span className={`text-15 ${checked ? 'font-medium text-main' : 'text-sub'}`}>{label}</span>
    </label>
  )
}
