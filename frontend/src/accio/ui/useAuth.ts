import { useSyncExternalStore } from 'react'

// 로그인 — 목업이라 계정을 브라우저에 저장한다. 실제 서비스라면 비밀번호는 서버에서 해시로만 다룬다.
export interface Account {
  email: string
  password: string
  name: string
  phone: string
  address?: string
}

interface AuthState {
  accounts: Account[]
  /** 로그인한 계정 이메일 */
  current: string | null
  /** 이메일별 연속 실패 횟수 */
  failures: Record<string, number>
  /** 5회 틀린 이메일이 다시 시도할 수 있는 시각(ms) */
  lockedUntil?: Record<string, number>
}

const KEY = 'accio:auth'
const listeners = new Set<() => void>()
export const MAX_FAILURES = 5
const LOCK_MS = 30_000

// 시안의 예시 계정 — 처음 온 사람도 바로 로그인해 볼 수 있다
const DEMO: Account = { email: 'abc@accio.kr', password: 'accio1234', name: '김액시오', phone: '010-1234-5678', address: '서울특별시 성동구 왕십리로 83-21' }
/** 화면에 안내하는 예시 계정 — 포트폴리오를 보는 사람이 바로 로그인해 볼 수 있게 */
export const DEMO_LOGIN = { email: DEMO.email, password: DEMO.password }

function read(): AuthState {
  try {
    const saved = localStorage.getItem(KEY)
    return saved ? JSON.parse(saved) : { accounts: [DEMO], current: null, failures: {} }
  } catch {
    return { accounts: [DEMO], current: null, failures: {} }
  }
}

let state = read()

// '로그인 유지'를 끄고 들어온 경우, 브라우저를 닫았다 열면(세션이 바뀌면) 로그아웃된 상태로 시작한다
try {
  if (localStorage.getItem('accio:auth:transient') && !sessionStorage.getItem('accio:auth:alive')) state = { ...state, current: null }
} catch {
  // 저장소를 못 쓰면 이번 방문 동안만 유지된다
}

function write(next: AuthState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // 저장이 막혀도 이번 방문 동안은 유지된다
  }
  listeners.forEach((notify) => notify())
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** 영문·숫자를 모두 포함해 8자 이상 */
export const isValidPassword = (pw: string) => pw.length >= 8 && /[a-zA-Z]/.test(pw) && /\d/.test(pw)
export const isTakenEmail = (email: string) => state.accounts.some((a) => a.email === email.trim().toLowerCase())
/** 훅 밖(대화 저장소 등)에서 로그인했는지 볼 때 */
export const isLoggedIn = () => state.current !== null

export type LoginResult = { ok: true } | { ok: false; field: 'email' | 'password'; message: string }

export const authActions = {
  login(email: string, password: string, keep: boolean): LoginResult {
    const key = email.trim().toLowerCase()
    const account = state.accounts.find((a) => a.email === key)
    if (!account) return { ok: false, field: 'email', message: '가입되지 않은 이메일이에요' }
    const until = state.lockedUntil?.[key] ?? 0
    if (until > Date.now()) {
      return { ok: false, field: 'password', message: `5회 틀려서 잠겼어요. ${Math.ceil((until - Date.now()) / 1000)}초 뒤에 다시 시도해 주세요` }
    }
    const failed = until ? 0 : (state.failures[key] ?? 0)
    if (account.password !== password) {
      const count = failed + 1
      const locked = count >= MAX_FAILURES
      write({
        ...state,
        failures: { ...state.failures, [key]: locked ? 0 : count },
        lockedUntil: { ...state.lockedUntil, [key]: locked ? Date.now() + LOCK_MS : 0 },
      })
      return {
        ok: false,
        field: 'password',
        message: locked ? '5회 틀려서 30초 동안 잠겼어요' : `비밀번호가 맞지 않아요. 5회 틀리면 잠깐 잠겨요 (${count}/5)`,
      }
    }
    write({ ...state, current: key, failures: { ...state.failures, [key]: 0 }, lockedUntil: { ...state.lockedUntil, [key]: 0 } })
    try {
      if (keep) localStorage.removeItem('accio:auth:transient')
      else {
        localStorage.setItem('accio:auth:transient', '1')
        sessionStorage.setItem('accio:auth:alive', '1')
      }
    } catch {
      // 저장소를 못 쓰면 이번 방문 동안만 유지된다
    }
    return { ok: true }
  },
  /** 소셜 로그인 — 목업이라 예시 계정으로 들어간다 */
  socialLogin: () => write({ ...state, current: DEMO.email }),
  signup(account: Account) {
    const next = { ...account, email: account.email.trim().toLowerCase() }
    write({ ...state, accounts: [...state.accounts, next], current: next.email })
  },
  logout: () => write({ ...state, current: null }),
}

export default function useAuth() {
  const snapshot = useSyncExternalStore(
    (notify) => {
      listeners.add(notify)
      return () => listeners.delete(notify)
    },
    () => state,
    () => state,
  )
  return snapshot.accounts.find((a) => a.email === snapshot.current) ?? null
}
