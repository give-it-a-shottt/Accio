import type { ReactNode } from 'react'
import spinner14Brand from '../assets/v4/icons/spinner-14-brand.svg'
import spinner16 from '../assets/v4/icons/spinner-16.svg'
import spinner18White from '../assets/v4/icons/spinner-18-white.svg'
import spinner40 from '../assets/v4/icons/spinner-40.svg'
import stateAlert from '../assets/v4/icons/state-alert.svg'
import stateBox from '../assets/v4/icons/state-box.svg'
import stateCloud from '../assets/v4/icons/state-cloud.svg'
import stateHeart from '../assets/v4/icons/state-heart.svg'
import stateLock from '../assets/v4/icons/state-lock.svg'
import stateSearch from '../assets/v4/icons/state-search.svg'
import { hideToast, useToast } from './toast'
import { DEMO_LOGIN } from './useAuth'

// 상태 화면 공통 조각 (Figma States Board 438:3016) — 빈 상태·오류·로그인 필요, 스켈레톤, 스피너, 토스트

const STATE_ICONS = { box: stateBox, alert: stateAlert, cloud: stateCloud, heart: stateHeart, lock: stateLock, search: stateSearch }

export interface StateAction {
  label: string
  href?: string
  onClick?: () => void
}

const ACTION_CLASS = 'flex h-12 min-w-30 items-center justify-center rounded-md border border-regular bg-white px-5 text-16 font-semibold text-main'

/**
 * 빈 상태 · 오류 · 로그인 필요 안내 (State/Empty 437:3060) — 72 원형 아이콘, 제목 18, 설명 14, 테두리 버튼.
 * 아이콘만 바꾸고 문구는 속성으로 넣는다.
 */
export function StateEmpty({
  icon,
  title,
  description,
  action,
  children,
  className = '',
}: {
  icon: keyof typeof STATE_ICONS
  title: string
  description?: ReactNode
  action?: StateAction
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center gap-3 py-6 text-center ${className}`}>
      <img src={STATE_ICONS[icon]} alt="" className="size-18" />
      <p className="text-18 font-semibold text-main">{title}</p>
      {description && <p className="text-14 whitespace-pre-line text-sub-weak">{description}</p>}
      {action && (
        <div className="pt-1">
          {action.href ? (
            <a href={action.href} className={ACTION_CLASS}>
              {action.label}
            </a>
          ) : (
            <button type="button" onClick={action.onClick} className={ACTION_CLASS}>
              {action.label}
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

/** 예시 계정 한 줄 안내 — 로그인이 필요한 화면 아래에 둔다 */
export function DemoAccountHint({ className = '' }: { className?: string }) {
  return (
    <p className={`text-12 text-sub-weak ${className}`}>
      예시 계정 <span className="font-medium text-sub">{DEMO_LOGIN.email}</span> · <span className="font-medium text-sub">{DEMO_LOGIN.password}</span>
    </p>
  )
}

/** 스켈레톤 막대 — 회색 바탕 위로 밝은 띠가 지나간다 (1400ms linear 반복) */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block bg-regular bg-[linear-gradient(90deg,transparent_0%,rgb(255_255_255/0.55)_50%,transparent_100%)] bg-size-[200%_100%] bg-no-repeat motion-safe:animate-[accio-shimmer_1400ms_linear_infinite] ${className}`}
    />
  )
}

/** 상품 카드 스켈레톤 (Skeleton/Card 437:3069) — 정사각 썸네일 + 막대 세 줄 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`flex flex-col gap-2 ${className}`}>
      <Skeleton className="aspect-square w-full rounded-md" />
      <Skeleton className="h-3 w-15 rounded-[6px]" />
      <Skeleton className="h-3 w-35 max-w-full rounded-[6px]" />
      <Skeleton className="h-3 w-22 rounded-[6px]" />
    </div>
  )
}

const SPINNERS = { 40: spinner40, 18: spinner18White, 16: spinner16, 14: spinner14Brand }

/** 도는 스피너 — 40 결제 확인(검정), 18 주 버튼 안(흰색), 16 안내 배너(검정), 14 AI 채움(오렌지) */
export function Spinner({ size, className = '' }: { size: keyof typeof SPINNERS; className?: string }) {
  return <img src={SPINNERS[size]} alt="" aria-hidden className={`shrink-0 animate-spin ${className}`} style={{ width: size, height: size }} />
}

/** 화면 아래 토스트 하나 — AccioApp 이 한 번 그린다. 모바일 탭바 위, PC 는 아래 가운데 */
export function ToastHost() {
  const toast = useToast()
  if (!toast) return null
  const { action } = toast
  const runAction = () => {
    action?.onClick?.()
    hideToast()
  }
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-60 flex justify-center px-4 lg:bottom-10">
      <div
        key={toast.id}
        role={toast.error ? 'alert' : 'status'}
        className="pointer-events-auto flex w-full max-w-[358px] items-center gap-2.5 rounded-[14px] bg-main py-3.5 pr-3 pl-4 text-14 text-white shadow-accio-3 motion-safe:animate-[accio-toast-in_200ms_ease-out] lg:max-w-105"
      >
        {toast.error && <span aria-hidden className="size-2 shrink-0 rounded-full bg-status-error" />}
        <p className="min-w-0 flex-1 font-medium">{toast.message}</p>
        {action?.href ? (
          <a href={action.href} onClick={hideToast} className="shrink-0 font-semibold whitespace-nowrap">
            {action.label}
          </a>
        ) : (
          (action || toast.error) && (
            <button type="button" onClick={runAction} className={`shrink-0 font-semibold whitespace-nowrap ${toast.error ? 'opacity-70' : ''}`}>
              {action?.label ?? '닫기'}
            </button>
          )
        )}
      </div>
    </div>
  )
}
