import { useSyncExternalStore } from 'react'
import { respond, respondToImage, type AiReply } from '../data/aiEngine'
import { isLoggedIn } from './useAuth'
import { latestOrder } from './useOrders'

// AI 대화 — /ai 전체 화면과 플로팅 위젯이 같은 대화를 함께 쓴다(위젯에서 '전체화면'을 눌러도 이어진다).
/** 답 대신 띄우는 안내 카드 — 내 정보 질문인데 로그인 전(login) · 무료 사용량 초과(limit, until 까지 대기) */
export type AiNotice = { kind: 'login'; topic: string; question: string } | { kind: 'limit'; until: number; question: string }

export type ChatMessage =
  | { id: string; role: 'user'; text: string; /** 첨부한 사진 수 (예전 기록은 true) */ image?: number | boolean }
  | { id: string; role: 'ai'; reply: AiReply; confirmState?: 'pending' | 'added' | 'cancelled'; notice?: AiNotice; stopped?: boolean }

export interface Conversation {
  id: string
  title: string
  updatedAt: number
  messages: ChatMessage[]
}

interface ChatState {
  conversations: Conversation[]
  activeId: string | null
  /** 답을 기다리는 중(입력 중 표시) */
  thinking: boolean
  /** 글자가 흘러나오는 중인 답 — 끝나기 전까지 입력을 잠그고 결과 카드를 숨긴다 */
  streamingId: string | null
  /** 사용량 한도에 걸려 이 시각(ms)까지 입력이 잠긴다 */
  limitUntil: number
}

const KEY = 'accio:ai'
const DAY = 24 * 60 * 60 * 1000
const listeners = new Set<() => void>()
let seq = 0
const uid = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`

/** 질문 하나로 대화를 만든다 (사이드바 기록 시드용) */
function seedConversation(question: string, ago: number): Conversation {
  const reply = respond(question, [])
  return {
    id: uid(),
    title: question.replace(/(찾아줘|추천해줘|담아줘)$/, '').trim(),
    updatedAt: Date.now() - ago,
    messages: [
      { id: uid(), role: 'user', text: question },
      { id: uid(), role: 'ai', reply, confirmState: reply.confirm ? 'pending' : undefined },
    ],
  }
}

// 처음 온 사람에게도 시안처럼 '오늘 2 · 지난 7일 3' 기록이 보이도록 한다
function seed(): ChatState {
  return {
    activeId: null,
    thinking: false,
    streamingId: null,
    limitUntil: 0,
    conversations: [
      { ...seedConversation('김치찌개 재료 한 번에', 30 * 60 * 1000), title: '김치찌개 재료 한 번에' },
      { ...seedConversation('캠핑 의자 가벼운 거', 2 * 60 * 60 * 1000), title: '캠핑 의자 가벼운 거' },
      { ...seedConversation('3만원대 집들이 선물', 2 * DAY), title: '3만원대 집들이 선물' },
      { ...seedConversation('내 주문 어디까지 왔어?', 3 * DAY), title: '내 주문 어디까지 왔어?' },
      { ...seedConversation('비 오는 날 운동화', 5 * DAY), title: '비 오는 날 운동화' },
    ],
  }
}

function read(): ChatState {
  try {
    const saved = localStorage.getItem(KEY)
    return saved ? { ...JSON.parse(saved), thinking: false, streamingId: null, limitUntil: 0 } : seed()
  } catch {
    return seed()
  }
}

let state = read()

function write(next: ChatState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify({ conversations: next.conversations, activeId: next.activeId }))
  } catch {
    // 저장이 막혀도 이번 방문 동안은 유지된다
  }
  listeners.forEach((notify) => notify())
}

function updateConversation(id: string | null, change: (c: Conversation) => Conversation) {
  write({ ...state, conversations: state.conversations.map((c) => (c.id === id ? change(c) : c)) })
}
const updateActive = (change: (c: Conversation) => Conversation) => updateConversation(state.activeId, change)

/** 지금 대화의 AI 답들 — '다 담아줘'처럼 앞 결과를 이어 받는 질문에 쓴다 */
const aiReplies = (c: Conversation | undefined) =>
  (c?.messages ?? []).flatMap((m) => (m.role === 'ai' ? [m.reply] : []))

function answer(makeReply: (history: AiReply[]) => AiReply, notice?: AiNotice) {
  // 기다리는 사이 다른 대화를 열어도 답은 질문한 대화에 붙인다
  const targetId = state.activeId
  write({ ...state, thinking: true })
  // 실제 AI 처럼 잠깐 생각하는 틈을 둔다
  window.setTimeout(() => {
    const target = state.conversations.find((c) => c.id === targetId)
    const reply = makeReply(aiReplies(target))
    const id = uid()
    // 안내 카드는 바로 보이고, 일반 답은 글자가 흘러나온다
    state = { ...state, thinking: false, streamingId: notice ? state.streamingId : id }
    updateConversation(targetId, (c) => ({
      ...c,
      updatedAt: Date.now(),
      messages: [...c.messages, { id, role: 'ai', reply, notice, confirmState: reply.confirm ? 'pending' : undefined }],
    }))
  }, 650)
}

// ── 무료 AI 사용량 한도(429 흉내) — 1분에 6번까지 묻고, 넘으면 가장 오래된 질문 1분 뒤까지 잠근다 ──
const LIMIT_COUNT = 6
const LIMIT_WINDOW = 60_000
let askedAt: number[] = []
/** 이번 질문으로 한도를 넘으면 풀리는 시각, 아니면 0 */
function checkLimit() {
  const now = Date.now()
  askedAt = askedAt.filter((t) => now - t < LIMIT_WINDOW)
  if (askedAt.length >= LIMIT_COUNT) return askedAt[0] + LIMIT_WINDOW
  askedAt.push(now)
  return 0
}

// 내 주문·장바구니·찜을 묻는 말 — 로그인해야 답할 수 있다
const MY_INFO: [RegExp, string][] = [
  [/주문.*(어디|언제|배송)|어디까지|배송 조회|지난번|또 주문/, '주문'],
  [/내 장바구니|장바구니에 (뭐|뭘|무엇)/, '장바구니'],
  [/찜한|내 찜/, '찜'],
]

// 흘러나오는 답이 지금 몇 글자까지 보이는지 — '답변 멈추기'를 누르면 거기까지만 남긴다
let streamProgress = { id: '', shown: 0 }

function ensureConversation(title: string) {
  if (state.activeId && state.conversations.some((c) => c.id === state.activeId)) return
  const conversation: Conversation = { id: uid(), title: title.slice(0, 20), updatedAt: Date.now(), messages: [] }
  write({ ...state, activeId: conversation.id, conversations: [conversation, ...state.conversations] })
}

export const chatActions = {
  /** '새 대화' — 첫 화면으로 돌아간다 */
  startNew: () => write({ ...state, activeId: null }),
  open: (id: string) => write({ ...state, activeId: id }),
  send(text: string) {
    const question = text.trim()
    if (!question || state.thinking || state.streamingId || Date.now() < state.limitUntil) return
    ensureConversation(question)
    updateActive((c) => ({ ...c, updatedAt: Date.now(), messages: [...c.messages, { id: uid(), role: 'user', text: question }] }))

    const topic = MY_INFO.find(([pattern]) => pattern.test(question))?.[1]
    if (topic && !isLoggedIn()) {
      answer(() => ({ text: [] }), { kind: 'login', topic, question })
      return
    }
    const until = checkLimit()
    if (until) {
      state = { ...state, limitUntil: until }
      answer(() => ({ text: [] }), { kind: 'limit', until, question })
      return
    }
    answer((history) => respond(question, history, latestOrder()))
  },
  /** 사진 첨부 — 글 없이 보내도 된다 */
  sendImage(count: number, text = '') {
    if (state.thinking || state.streamingId || Date.now() < state.limitUntil) return
    const question = text.trim() || '이 사진이랑 비슷한 상품 찾아줘'
    ensureConversation(text.trim() || '사진으로 찾기')
    updateActive((c) => ({ ...c, messages: [...c.messages, { id: uid(), role: 'user', text: question, image: count }] }))
    const until = checkLimit()
    if (until) {
      state = { ...state, limitUntil: until }
      answer(() => ({ text: [] }), { kind: 'limit', until, question })
      return
    }
    answer(() => respondToImage())
  },
  reportStream: (id: string, shown: number) => {
    streamProgress = { id, shown }
  },
  /** 다 흘러나왔다 — 입력을 다시 연다 */
  finishStream: (id: string) => {
    if (state.streamingId === id) write({ ...state, streamingId: null })
  },
  /** 답변 멈추기 — 보인 데까지만 남기고 결과 카드는 만들지 않는다 */
  stopStream() {
    const id = state.streamingId
    if (!id) return
    const shown = streamProgress.id === id ? streamProgress.shown : 0
    state = { ...state, streamingId: null }
    updateActive((c) => ({
      ...c,
      messages: c.messages.map((m) => {
        if (m.id !== id || m.role !== 'ai') return m
        let left = shown
        const text = m.reply.text.map((line) => {
          const part = line.slice(0, Math.max(0, left))
          left -= line.length
          return part
        })
        return { ...m, stopped: true, confirmState: undefined, reply: { text: text.filter(Boolean), chips: m.reply.chips } }
      }),
    }))
  },
  /** 한도가 풀리면 입력창을 다시 연다 */
  clearLimit: () => {
    if (state.limitUntil && Date.now() >= state.limitUntil) write({ ...state, limitUntil: 0 })
  },
  setConfirm: (messageId: string, confirmState: 'added' | 'cancelled') =>
    updateActive((c) => ({
      ...c,
      messages: c.messages.map((m) => (m.id === messageId && m.role === 'ai' ? { ...m, confirmState } : m)),
    })),
}

export default function useAiChat() {
  const snapshot = useSyncExternalStore(
    (notify) => {
      listeners.add(notify)
      return () => listeners.delete(notify)
    },
    () => state,
    () => state,
  )
  const active = snapshot.conversations.find((c) => c.id === snapshot.activeId)
  // 결과 패널은 이 대화에서 가장 최근에 나온 결과를 보여 준다
  const latestResult = [...aiReplies(active)].reverse().find((r) => r.result)?.result
  return { ...snapshot, active, latestResult }
}

// AI 위젯 열림 상태 — 플로팅 버튼·목록의 'AI 검색' 등 어디서든 연다
let widgetOpen = false
const widgetListeners = new Set<() => void>()
export function setAiWidgetOpen(next: boolean) {
  widgetOpen = next
  widgetListeners.forEach((notify) => notify())
}
export const openAiWidget = () => setAiWidgetOpen(true)
export function useAiWidgetOpen() {
  return useSyncExternalStore(
    (notify) => {
      widgetListeners.add(notify)
      return () => widgetListeners.delete(notify)
    },
    () => widgetOpen,
    () => false,
  )
}
