import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import chevronLeft from '../assets/v4/icons/chevron-left.svg'
import chevronRight from '../assets/v4/icons/chevron-right.svg'
import checkedOn from '../assets/v4/icons/checked-on.svg'
import chevronRightWeak from '../assets/v4/icons/chevron-right-weak.svg'
import minusIcon from '../assets/v4/icons/minus.svg'
import plusIcon from '../assets/v4/icons/plus.svg'
import symbol from '../assets/v4/logo/symbol.svg'
import wordmark from '../assets/v4/logo/wordmark-dark.svg'
import { accioHref } from '../routes'

/** 시안(1440) 좌우 120 → 콘텐츠 1200. 모바일(390)은 좌우 20 */
export const CONTAINER_CLASS = 'mx-auto w-full max-w-[1240px] px-5'

/**
 * 가로 스크롤 트랙이 화면 끝까지 닿되 첫 카드는 Container 콘텐츠 왼쪽 선에 맞도록 하는 여백.
 * 시안 폭(1440)보다 넓은 화면에서는 트랙을 1440 으로 묶고 양 끝을 흐려, 카드가 화면 끝까지 늘어서지 않게 한다.
 */
export const BLEED_TRACK_CLASS =
  'flex snap-x snap-mandatory overflow-x-auto scrollbar-none px-5 scroll-px-5 lg:mx-auto lg:w-full lg:max-w-[1440px] lg:px-[max(20px,calc((min(100%,1440px)-1200px)/2))] lg:scroll-px-[max(20px,calc((100%-1200px)/2))] min-[1441px]:[mask-image:linear-gradient(to_right,transparent,#000_96px,#000_calc(100%-96px),transparent)]'

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${CONTAINER_CLASS} ${className}`}>{children}</div>
}

/**
 * AI 표시 말풍선 점 — 로고의 i 위 점과 같은 모양(왼쪽 아래만 뾰족). 오렌지는 AI 기능에서만 쓴다.
 * size 는 시안의 점 지름(px).
 */
export function AiDot({ size = 10, muted = false, className = '' }: { size?: number; /** AI 가 쉬는 중(실패·아직 안 열림) — 회색 */ muted?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 rounded-full rounded-bl-[10%] ${muted ? 'bg-icon-disabled' : 'bg-accio'} ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

/** 로고 락업(심볼 + 워드마크). height 는 워드마크 높이 — 헤더 46.44 / 모바일 30.96 / 푸터 34.4 */
export function Logo({ height, className = '' }: { height: number; className?: string }) {
  return (
    <a href={accioHref()} aria-label="Accio 홈" className={`flex shrink-0 items-center ${className}`} style={{ gap: height * 0.1628 }}>
      <img src={symbol} alt="" style={{ width: height * 0.8023, height: height * 0.6279 }} />
      <img src={wordmark} alt="" style={{ width: height * 1.9884, height }} />
    </a>
  )
}

/** 섹션 머리 — 제목(모바일 20 / PC 24) + 보조 문구 + 오른쪽 요소 */
export function SectionHeader({
  title,
  description,
  aside,
  className = '',
}: {
  title: ReactNode
  description?: string
  aside?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <div className="flex min-w-0 items-center gap-2 lg:gap-3">
        <h2 className="text-20 font-semibold whitespace-nowrap text-main lg:text-24">{title}</h2>
        {description && <p className="hidden truncate text-14 text-sub-weak lg:block">{description}</p>}
      </div>
      {aside}
    </div>
  )
}

/** '전체 보기 >' — 모바일은 '전체' 로 줄인다 */
export function ViewAllLink({ href }: { href: string }) {
  return (
    <a href={href} className="flex shrink-0 items-center gap-0.5 text-13 font-medium text-sub-weak lg:text-14">
      <span className="lg:hidden">전체</span>
      <span className="hidden lg:inline">전체 보기</span>
      <img src={chevronRightWeak} alt="" className="size-4" />
    </a>
  )
}

/** 동그란 화살표 버튼. size 36(섹션 머리) · 44(배너 위) · 48(트랙 위) */
export function ArrowButton({
  direction,
  onClick,
  disabled,
  size = 36,
  floating = false,
  className = '',
}: {
  direction: 'prev' | 'next'
  onClick: () => void
  disabled?: boolean
  size?: 36 | 44 | 48
  /** 사진 위에 떠 있는 버튼은 그림자를 준다 */
  floating?: boolean
  className?: string
}) {
  const sizeClass = { 36: 'size-9', 44: 'size-11', 48: 'size-12' }[size]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? '이전' : '다음'}
      className={`flex shrink-0 items-center justify-center rounded-full border border-regular bg-white transition-opacity disabled:opacity-40 ${floating ? 'shadow-accio-2' : ''} ${sizeClass} ${className}`}
    >
      <img src={direction === 'prev' ? chevronLeft : chevronRight} alt="" className="size-4" />
    </button>
  )
}

/** '02 / 08' 위치 표시 + 이전·다음 버튼 */
export function CarouselControls({
  index,
  count,
  onPrev,
  onNext,
  pad = false,
}: {
  index: number
  /** 넘길 수 있는 위치 수 — 분모로 보여 주고 버튼을 끌 때도 쓴다 */
  count: number
  onPrev: () => void
  onNext: () => void
  /** 기획전처럼 두 자리로 맞춰 보여 줄 때 */
  pad?: boolean
}) {
  const format = (n: number) => (pad ? String(n).padStart(2, '0') : String(n))
  return (
    <div className="flex items-center gap-2">
      <p className="flex gap-1 pr-2 text-13 tabular-nums" aria-live="polite">
        {/* 분모는 배너 수가 아니라 멈출 수 있는 위치 수 — 한 칸 넘길 때마다 1씩 오른다 */}
        <span className="font-semibold text-main">{format(index)}</span>
        <span className="text-sub-weak">/ {format(count)}</span>
      </p>
      <ArrowButton direction="prev" onClick={onPrev} disabled={index <= 1} />
      <ArrowButton direction="next" onClick={onNext} disabled={index >= count} />
    </div>
  )
}

/** 디자인 시스템 Button — 높이 48 · radius 12 · 좌우 20. Primary(오렌지)는 한 화면 핵심 행동 1개에만 */
export function Button({
  children,
  variant = 'outline',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }) {
  const variantClass = {
    primary: 'bg-accio text-white active:bg-accio-strong disabled:bg-regular disabled:text-disabled',
    secondary: 'bg-accio-soft text-accio-strong active:bg-[#ffe8df] disabled:bg-regular disabled:text-disabled',
    outline: 'border border-regular bg-white text-main active:bg-regular disabled:text-disabled',
    ghost: 'text-main active:bg-regular disabled:text-disabled',
  }[variant]
  return (
    <button
      type="button"
      className={`flex h-12 items-center justify-center rounded-md px-5 text-16 font-semibold whitespace-nowrap ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

/** 디자인 시스템 Checkbox — 켜짐은 검은 네모 + 흰 체크, 꺼짐은 회색 테두리. 진짜 체크박스는 감싼 label 이 맡는다 */
export function CheckMark({ checked }: { checked: boolean }) {
  return checked ? (
    <img src={checkedOn} alt="" className="block size-5 shrink-0" />
  ) : (
    <span aria-hidden className="block size-5 shrink-0 rounded-[6px] border-[1.5px] border-regular bg-white" />
  )
}

/** 수량 스테퍼 — 상세는 칸 32, 장바구니는 30 */
export function Stepper({
  value,
  onChange,
  compact = false,
  label = '수량',
}: {
  value: number
  onChange: (n: number) => void
  compact?: boolean
  label?: string
}) {
  const cell = compact ? 'size-[30px]' : 'size-8'
  return (
    <div role="group" aria-label={label} className="flex items-center rounded-sm border border-regular bg-white">
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="수량 빼기" className={`flex items-center justify-center disabled:opacity-30 ${cell}`}>
        <img src={minusIcon} alt="" className="size-4" />
      </button>
      <span className={`flex items-center justify-center text-14 font-semibold text-main tabular-nums ${compact ? 'h-[30px] w-9' : 'h-8 w-10'}`} aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= 99} aria-label="수량 더하기" className={`flex items-center justify-center disabled:opacity-30 ${cell}`}>
        <img src={plusIcon} alt="" className="size-4" />
      </button>
    </div>
  )
}

/**
 * 디자인 시스템 Input — 라벨 14 · 높이 48 · radius 12. 기본은 회색 테두리, 포커스는 검은 1.5,
 * 오류는 빨간 1.5 + 빨간 도움말. 성공 도움말(예: 사용할 수 있는 이메일)은 회색으로 둔다.
 */
export function TextField({
  label,
  helper,
  error,
  id,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; helper?: string; error?: string; id: string }) {
  const message = error ?? helper
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-14 font-medium text-main">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={message ? `${id}-help` : undefined}
        className={`h-12 w-full rounded-md bg-white px-4 text-15 text-main outline-none placeholder:text-disabled disabled:border-transparent disabled:bg-light disabled:text-sub-weak ${
          error ? 'border-[1.5px] border-status-error' : 'border border-regular focus:border-[1.5px] focus:border-black'
        }`}
        {...props}
      />
      {message && (
        <p id={`${id}-help`} className={`text-12 ${error ? 'text-status-error' : 'text-sub-weak'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
