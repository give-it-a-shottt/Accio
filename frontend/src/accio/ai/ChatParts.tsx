import { useEffect, useRef, useState, type FormEvent } from 'react'
import arrowRight from '../assets/v4/icons/arrow-right.svg'
import close10White from '../assets/v4/icons/close-10-white.svg'
import imageIcon from '../assets/v4/icons/image.svg'
import send16 from '../assets/v4/icons/send-16.svg'
import sendActive from '../assets/v4/icons/send.svg'
import { describePick, type ResultGroup } from '../data/aiEngine'
import { productHref, type Product } from '../data/catalog'
import { accioHref } from '../routes'
import { AiDot, Button } from '../ui/primitives'
import { DemoAccountHint } from '../ui/states'
import { cartActions, findProduct } from '../ui/useCart'
import useAiChat, { chatActions, type AiNotice, type ChatMessage } from '../ui/useAiChat'
import { formatWon } from '../utils/format'

/** AI 말풍선 옆 동그란 아바타 — 연한 오렌지 원 + 말풍선 점 */
export function AiAvatar({ size = 28 }: { size?: 24 | 28 | 56 }) {
  const box = { 24: 'size-6', 28: 'size-7', 56: 'size-14' }[size]
  const dot = { 24: 10, 28: 12, 56: 24 }[size]
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full bg-accio-soft ${box}`}>
      <AiDot size={dot} />
    </span>
  )
}

/** AI 추천 질문 칩 — 누르면 바로 질문을 보낸다 */
export function AiChip({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => chatActions.send(label)}
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-regular bg-white px-4 py-2 text-14 font-medium whitespace-nowrap text-main hover:border-accio"
    >
      <AiDot size={9.8} />
      {label}
    </button>
  )
}

/** 1초마다 지금 시각을 다시 읽는다 — 한도 카운트다운용. active 일 때만 돈다 */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [active])
  return now
}

const mmss = (ms: number) => {
  const sec = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
}

/** 첨부한 사진 — 형식·용량이 맞지 않으면 error 가 붙고 보낼 때 빠진다 */
interface Attachment {
  id: number
  url: string
  name: string
  error?: string
}
const MAX_PHOTOS = 3
const MAX_BYTES = 10 * 1024 * 1024
const ORDINALS = ['첫', '두', '세']

/**
 * 입력창 — 왼쪽 사진 첨부, 오른쪽 보내기(입력하면 오렌지로 켜진다).
 * 답이 흘러나오는 동안·사용량 한도에 걸린 동안은 잠그고 이유를 자리 글자로 알려 준다 (상태 시안 438:3244 · 438:3286).
 * 사진은 미리보기로 붙였다가 글 없이도 보낼 수 있고, 형식·용량 오류는 입력창 위에 안내한다 (439:3175).
 */
export function Composer({ placeholder, size = 'lg', disabled = false }: { placeholder: string; size?: 'lg' | 'md' | 'sm'; disabled?: boolean }) {
  const { thinking, streamingId, limitUntil } = useAiChat()
  const now = useNow(limitUntil > 0)
  const limited = limitUntil > now
  useEffect(() => {
    if (limitUntil > 0 && !limited) chatActions.clearLimit()
  }, [limitUntil, limited])

  const [text, setText] = useState('')
  const [files, setFiles] = useState<Attachment[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const height = { lg: 'h-14', md: 'h-12', sm: 'h-11' }[size]
  const sendSize = size === 'lg' ? 'size-10' : 'size-8'

  const locked = disabled || thinking || !!streamingId || limited
  const lockText = streamingId ? '답변이 끝나면 입력할 수 있어요' : limited ? `${mmss(limitUntil - now)} 뒤에 다시 입력할 수 있어요` : null
  const valid = files.filter((f) => !f.error)
  const errorIndex = files.findIndex((f) => f.error)
  const ready = !locked && (text.trim().length > 0 || valid.length > 0)

  const addFiles = (list: FileList) => {
    const added = Array.from(list)
      .slice(0, MAX_PHOTOS - files.length)
      .map((file, i) => ({
        id: Date.now() + i,
        url: URL.createObjectURL(file),
        name: file.name,
        error: !/^image\/(jpeg|png)$/.test(file.type) ? '올릴 수 없는 형식이에요' : file.size > MAX_BYTES ? '10MB를 넘어요' : undefined,
      }))
    setFiles((prev) => [...prev, ...added])
  }
  const removeFile = (id: number) =>
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((f) => f.id !== id)
    })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!ready) return
    if (valid.length > 0) chatActions.sendImage(valid.length, text)
    else chatActions.send(text)
    files.forEach((f) => URL.revokeObjectURL(f.url))
    setFiles([])
    setText('')
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {streamingId && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={chatActions.stopStream}
            className="flex items-center gap-1.5 rounded-full border border-regular bg-white px-3.5 py-2 text-13 font-medium text-main"
          >
            <span aria-hidden className="size-2.5 rounded-[2px] bg-icon-main" />
            답변 멈추기
          </button>
        </div>
      )}
      {files.length > 0 && (
        <ul aria-label="첨부한 사진" className="flex gap-2">
          {files.map((f) => (
            <li key={f.id} className={`relative size-18 shrink-0 overflow-hidden rounded-md ${f.error ? 'border-[1.5px] border-status-error' : ''}`}>
              <img src={f.url} alt={f.name} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                aria-label={`${f.name} 빼기`}
                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-main"
              >
                <img src={close10White} alt="" className="size-2.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {errorIndex >= 0 && (
        <p role="alert" className="flex items-center gap-1.5 text-12 text-status-error">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-status-error" />
          {ORDINALS[errorIndex]} 번째 사진이 {files[errorIndex].error} · jpg·png만 가능
        </p>
      )}
      <form
        onSubmit={onSubmit}
        className={`flex w-full items-center gap-2.5 rounded-full border pr-2 pl-3.5 ${height} ${
          locked ? 'border-regular bg-light' : 'border-regular bg-white shadow-accio-1 focus-within:border-black'
        }`}
      >
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={locked || files.length >= MAX_PHOTOS}
          aria-label="사진으로 찾기"
          className="shrink-0 disabled:opacity-40"
        >
          <img src={imageIcon} alt="" className="size-6" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={lockText ?? placeholder}
          disabled={!!lockText}
          aria-label="AI에게 묻기"
          className={`min-w-0 flex-1 bg-transparent text-main outline-none placeholder:text-disabled ${size === 'lg' ? 'text-15' : 'text-14'}`}
        />
        <button type="submit" disabled={!ready} aria-label="보내기" className="shrink-0">
          {ready ? (
            <img src={sendActive} alt="" className={sendSize} />
          ) : (
            <span className={`flex items-center justify-center rounded-full bg-regular ${sendSize}`}>
              <img src={send16} alt="" className="size-4" />
            </span>
          )}
        </button>
      </form>
    </div>
  )
}

/** 답 대신 띄우는 안내 — 로그인 필요(438:3324) · 사용량 한도(438:3286) */
function NoticeCard({ notice }: { notice: AiNotice }) {
  const now = useNow(notice.kind === 'limit')
  if (notice.kind === 'login') {
    const what = ({ 주문: '주문을', 장바구니: '장바구니를', 찜: '찜한 상품을' } as Record<string, string>)[notice.topic] ?? '내 정보를'
    // 로그인하고 돌아오면 같은 대화에서 이 질문을 이어서 묻는다
    const next = `/ai?resume=${encodeURIComponent(notice.question)}`
    return (
      <div className="flex w-full max-w-[300px] flex-col gap-2.5 rounded-[14px] border border-regular px-4 py-3.5">
        <p className="text-15 font-semibold text-main">로그인하면 {what} 바로 확인해 드릴게요</p>
        <p className="text-13 text-sub">로그인 후 이 대화로 돌아와서 이어서 답해요.</p>
        <a
          href={`${accioHref('/login')}?next=${encodeURIComponent(next)}`}
          className="flex h-12 items-center justify-center rounded-md bg-accio text-16 font-semibold text-white"
        >
          로그인하기
        </a>
        <DemoAccountHint className="text-center" />
      </div>
    )
  }
  const waiting = notice.until > now
  return (
    <div className="flex w-full max-w-[300px] flex-col gap-2.5 rounded-[14px] bg-light px-4 py-3.5">
      <p className="text-15 font-semibold text-main">지금 AI 사용량이 많아요</p>
      <p className="text-13 text-sub">
        {waiting ? `${Math.ceil((notice.until - now) / 1000)}초 뒤에 다시 물어볼 수 있어요.` : '이제 다시 물어볼 수 있어요.'} 그동안 일반 검색은 그대로 쓸 수 있어요.
      </p>
      <div className="flex gap-2">
        <a
          href={`${accioHref('/list')}?q=${encodeURIComponent(notice.question)}`}
          className="flex h-12 flex-1 items-center justify-center rounded-md border border-regular bg-white text-15 font-semibold whitespace-nowrap text-main"
        >
          일반 검색으로
        </a>
        <Button variant="primary" disabled={waiting} onClick={() => chatActions.send(notice.question)} className="h-12 flex-1 text-15">
          다시 시도
        </Button>
      </div>
    </div>
  )
}

/** 여러 줄 답에서 앞에서부터 shown 글자까지만 남긴다 */
function revealLines(lines: string[], shown: number) {
  const out: string[] = []
  let left = shown
  for (const line of lines) {
    out.push(line.slice(0, Math.max(0, left)))
    left -= line.length
  }
  return out
}

/**
 * 글자가 흘러나오는 답 (상태 시안 438:3244) — 커서가 깜빡이며 몇 글자씩 보이고, 결과가 있는 답은 '상품 찾는 중'을 함께 띄운다.
 * 다 보이면 입력창을 다시 열고 결과 카드가 나타난다.
 */
function StreamingReply({ message, textClass }: { message: Extract<ChatMessage, { role: 'ai' }>; textClass: string }) {
  const full = message.reply.text
  const total = full.join('').length
  const [shown, setShown] = useState(0)

  useEffect(() => {
    const step = Math.max(1, Math.ceil(total / 90))
    const id = window.setInterval(() => setShown((s) => Math.min(total, s + step)), 24)
    return () => window.clearInterval(id)
  }, [total])
  useEffect(() => {
    chatActions.reportStream(message.id, shown)
    if (shown >= total) chatActions.finishStream(message.id)
  }, [shown, total, message.id])

  const lines = revealLines(full, shown)
  const caretAt = Math.max(0, lines.map((l) => l.length > 0).lastIndexOf(true))

  return (
    <>
      {lines.map((line, i) =>
        line || i === caretAt ? (
          <p key={i} className={`${textClass} text-main`}>
            {line}
            {i === caretAt && (
              <span
                aria-hidden
                className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 rounded-[2px] bg-icon-main motion-safe:animate-[accio-caret_1s_steps(1)_infinite]"
              />
            )}
          </p>
        ) : null,
      )}
      {message.reply.result && (
        <p role="status" className="flex items-center gap-1 text-12 text-sub-weak">
          {[0, 1, 2].map((i) => (
            <span key={i} aria-hidden className="size-1.5 animate-pulse rounded-full bg-icon-sub-weak" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
          <span className="pl-0.5">상품 찾는 중</span>
        </p>
      )}
    </>
  )
}

/** 결과 미니 카드 — 위젯(118) · 모바일 대화(132) 가로 줄 */
export function MiniResultCard({ product, size, selected = false, onClick }: { product: Product; size: 'widget' | 'mobile'; selected?: boolean; onClick?: () => void }) {
  const isWidget = size === 'widget'
  const className = `flex shrink-0 flex-col items-start gap-1 rounded-[10px] bg-white text-left ${
    isWidget ? 'w-[118px] px-1.5 pt-1.5 pb-2' : 'w-[132px] gap-1.5 rounded-md px-2 pt-2 pb-2.5'
  } ${selected ? 'border-[1.5px] border-black' : 'border border-regular'}`
  const body = (
    <>
      <img src={product.image} alt="" className={`w-full rounded-[6px] object-cover ${isWidget ? 'h-21' : 'h-25 rounded-sm'}`} />
      <span className="line-clamp-2 text-12 text-main">{product.fullName ?? product.name}</span>
      <span className={`font-semibold text-main tabular-nums ${isWidget ? 'text-13' : 'text-14'}`}>{formatWon(product.price)}</span>
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  ) : (
    <a href={productHref(product)} className={className}>
      {body}
    </a>
  )
}

/** 모바일 대화 안 결과 — 탭(재료) + 가로로 미는 카드 */
function InlineResult({ groups }: { groups: ResultGroup[] }) {
  const [tab, setTab] = useState(0)
  const group = groups[Math.min(tab, groups.length - 1)]
  return (
    <div className="flex w-full min-w-0 flex-col gap-2.5">
      {groups.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {groups.map((g, i) => (
            <button
              key={g.label}
              type="button"
              onClick={() => setTab(i)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-13 ${i === tab ? 'bg-main font-semibold text-white' : 'border border-regular bg-white font-medium text-sub'}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {group.products.slice(0, 8).map((p, i) => (
          <MiniResultCard key={p.id} product={p} size="mobile" selected={i === 0} />
        ))}
      </div>
    </div>
  )
}

/** '장바구니에 담을까요?' 확인 카드 */
function ConfirmCard({ message }: { message: Extract<ChatMessage, { role: 'ai' }> }) {
  const ids = message.reply.confirm?.productIds ?? []
  const products = ids.map(findProduct).filter((p): p is Product => !!p)
  if (products.length === 0) return null

  if (message.confirmState === 'added')
    return (
      <p className="flex w-full items-center justify-between rounded-[14px] border border-regular bg-white px-4 py-3.5 text-14 text-main">
        장바구니에 {products.length}개를 담았어요
        <a href={accioHref('/cart')} className="font-semibold text-accio-strong">
          장바구니 보기
        </a>
      </p>
    )
  if (message.confirmState === 'cancelled') return <p className="text-14 text-sub-weak">담지 않았어요. 다른 상품을 찾아 볼까요?</p>

  return (
    <div className="flex w-full flex-col gap-3 rounded-[14px] border border-regular bg-white px-4 py-3.5">
      <p className="text-15 font-semibold text-main">장바구니에 담을까요?</p>
      <p className="text-14 text-sub">{describePick(products)}</p>
      <div className="flex gap-2">
        <Button onClick={() => chatActions.setConfirm(message.id, 'cancelled')} className="flex-1">
          취소
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            products.forEach((p) => cartActions.add(p, '기본', 1))
            chatActions.setConfirm(message.id, 'added')
          }}
          className="flex-1"
        >
          담기
        </Button>
      </div>
    </div>
  )
}

/**
 * 대화 목록. variant 로 결과를 어디에 그릴지 정한다 —
 * 'page'(PC) 는 오른쪽 패널이 결과를 맡고, 'mobile' 은 대화 안에 탭+카드, 'widget' 은 카드 3장 + 전체화면 링크.
 */
export function MessageList({
  messages,
  thinking,
  variant,
  onExpand,
}: {
  messages: ChatMessage[]
  thinking: boolean
  variant: 'page' | 'mobile' | 'widget'
  onExpand?: () => void
}) {
  const { streamingId } = useAiChat()
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [messages.length, thinking, streamingId])

  const lastAiIndex = messages.map((m) => m.role).lastIndexOf('ai')
  const small = variant === 'widget'
  const bubbleText = small ? 'text-14' : 'text-15'

  return (
    <div className={`flex flex-col ${small ? 'gap-3.5' : 'gap-[18px] lg:gap-6'}`}>
      {messages.map((m, index) =>
        m.role === 'user' ? (
          <div key={m.id} className="flex justify-end">
            <p className={`max-w-[85%] rounded-[18px] rounded-br-[4px] bg-regular text-main ${small ? 'px-3.5 py-2 text-14' : 'px-4 py-2.5 text-15'}`}>
              {m.image && <span className="mr-1 text-sub">[사진{typeof m.image === 'number' && m.image > 1 ? ` ${m.image}장` : ''}]</span>}
              {m.text}
            </p>
          </div>
        ) : (
          <div key={m.id} className="flex flex-col gap-2">
            <div className={`flex items-start ${small ? 'gap-2' : 'gap-2.5'}`}>
              <AiAvatar size={small ? 24 : 28} />
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                {m.notice ? (
                  <NoticeCard notice={m.notice} />
                ) : m.id === streamingId ? (
                  <StreamingReply message={m} textClass={bubbleText} />
                ) : (
                  <>
                    {m.reply.text.map((line) => (
                      <p key={line} className={`${bubbleText} text-main`}>
                        {line}
                      </p>
                    ))}
                    {m.stopped && <p className="text-12 text-sub-weak">답변을 멈췄어요</p>}
                    {m.reply.result && variant === 'mobile' && <InlineResult groups={m.reply.result.groups} />}
                    {m.reply.result && variant === 'widget' && (
                      <div className="flex gap-2 overflow-x-auto scrollbar-none">
                        {m.reply.result.groups[0].products.slice(0, 3).map((p) => (
                          <MiniResultCard key={p.id} product={p} size="widget" />
                        ))}
                      </div>
                    )}
                    {m.reply.confirm && <ConfirmCard message={m} />}
                    {m.reply.link && (
                      <a href={m.reply.link.href} className="flex w-fit items-center gap-1 text-13 font-semibold text-main">
                        {m.reply.link.label}
                        <img src={arrowRight} alt="" className="size-4" />
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
            {m.notice?.kind === 'login' && index === lastAiIndex && (
              <div className={small ? 'pl-8' : 'pl-[38px]'}>
                <AiChip label="그냥 상품 찾을래" />
              </div>
            )}
            {variant === 'widget' && m.reply.result && m.id !== streamingId && (
              <button type="button" onClick={onExpand} className="flex w-fit items-center gap-1 pl-8 text-13 font-semibold text-main">
                결과 {m.reply.result.groups.reduce((n, g) => n + g.products.length, 0)}개 전체화면으로 보기
                <img src={arrowRight} alt="" className="size-4" />
              </button>
            )}
            {/* 추천 질문 칩은 마지막 답에만 — 모바일은 입력창 위에 따로 둔다 */}
            {index === lastAiIndex && variant !== 'mobile' && m.reply.chips && !thinking && !streamingId && (
              <div className={`flex flex-wrap gap-1.5 ${small ? 'pl-8' : 'pl-[38px]'}`}>
                {m.reply.chips.map((chip) => (
                  <AiChip key={chip} label={chip} />
                ))}
              </div>
            )}
          </div>
        ),
      )}
      {thinking && (
        <div className="flex items-center gap-2.5" role="status" aria-label="답을 만드는 중">
          <AiAvatar size={small ? 24 : 28} />
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-1.5 animate-pulse rounded-full bg-icon-sub-weak" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </span>
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}
