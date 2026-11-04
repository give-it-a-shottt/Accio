import { useSyncExternalStore } from 'react'

/** 화면 아래 토스트 (Figma Toast 437:3068) — 기본은 4초 뒤 닫히고, 오류는 사용자가 닫을 때까지 남는다 */
export interface ToastMessage {
  id: number
  message: string
  /** 오른쪽 글자 버튼 — 링크로 보내거나 함수를 부른다 */
  action?: { label: string; href?: string; onClick?: () => void }
  error?: boolean
}

let current: ToastMessage | null = null
let timer: number | undefined
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

export function hideToast() {
  window.clearTimeout(timer)
  current = null
  notify()
}

export function showToast(toast: Omit<ToastMessage, 'id'>) {
  window.clearTimeout(timer)
  current = { ...toast, id: Date.now() }
  if (!toast.error) timer = window.setTimeout(hideToast, 4000)
  notify()
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const get = () => current

export const useToast = () => useSyncExternalStore(subscribe, get, get)
