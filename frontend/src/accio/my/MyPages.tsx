import { useState } from 'react'
import chevronRightWeak from '../assets/v4/icons/chevron-right-weak.svg'
import close14Weak from '../assets/v4/icons/close-14-weak.svg'
import { productHref } from '../data/catalog'
import { accioHref } from '../routes'
import ProductCard from '../ui/ProductCard'
import { AiDot, Button, CheckMark } from '../ui/primitives'
import useAuth, { authActions } from '../ui/useAuth'
import { cartActions, findProduct } from '../ui/useCart'
import { FREQUENT_PURCHASES, recentActions, reviewActions, useMyReviews, useRecentViews } from '../ui/useMyData'
import useOrders, { formatDate, orderActions, useClaims, type ClaimStatus, type OrderStatus } from '../ui/useOrders'
import { StateEmpty } from '../ui/states'
import useWishlist from '../ui/useWishlist'
import { formatWon } from '../utils/format'
import { MY_MENU } from './menu'
import MyLayout from './MyLayout'
import { OrderCard, PhotoPicker } from './OrderParts'

const go = (path: string) => {
  window.location.hash = accioHref(path)
}

/** 배송완료 주문 중 아직 리뷰를 안 쓴 상품 */
function useWritableReviews() {
  const orders = useOrders()
  const reviews = useMyReviews()
  return orders
    .filter((o) => o.status === '배송완료')
    .flatMap((o) => o.lines.map((l) => ({ order: o, line: l })))
    .filter(({ order, line }) => !reviews.some((r) => r.orderNo === order.no && r.productId === line.productId))
}

const PROGRESS: OrderStatus[] = ['결제완료', '배송준비', '배송중', '배송완료']

/** 마이페이지 첫 화면 (Figma PC 427:1663 · MO 427:1877) */
export function MyHomePage() {
  const user = useAuth()
  const orders = useOrders()
  const recent = useRecentViews()
  const writable = useWritableReviews()
  const latest = orders[0]
  const stats: [string, string][] = [
    ['포인트', '3,900P'],
    ['쿠폰', '2장'],
    ['리뷰 작성 가능', `${writable.length}건`],
  ]

  return (
    <MyLayout path="/mypage" title="마이페이지">
      {/* 프로필 */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:rounded-xl lg:border lg:border-regular lg:px-8 lg:py-7">
        <div className="flex items-center gap-4">
          <span aria-hidden className="size-14 shrink-0 rounded-full bg-regular lg:size-16" />
          {user ? (
            <div className="flex flex-col gap-1">
              <p className="text-24 font-semibold text-main lg:text-20">{user.name} 님</p>
              <p className="text-14 text-sub-weak">{user.email}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-20 font-semibold text-main">로그인해 주세요</p>
              <a href={`${accioHref('/login')}?next=/mypage`} className="text-14 font-semibold text-accio-strong">
                로그인하고 내 주문 보기 →
              </a>
            </div>
          )}
        </div>
        <dl className="grid grid-cols-3 rounded-lg border border-regular py-4 text-center lg:flex lg:gap-10 lg:border-0 lg:p-0 lg:text-right">
          {stats.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className="text-13 text-sub-weak">
                <span className="lg:hidden">{label === '리뷰 작성 가능' ? '리뷰' : label}</span>
                <span className="hidden lg:inline">{label}</span>
              </dt>
              <dd className="text-16 font-semibold text-main tabular-nums lg:text-20">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 진행 중인 주문 */}
      <section aria-label="진행 중인 주문" className="flex flex-col gap-4">
        <h2 className="hidden text-20 font-semibold text-main lg:block">진행 중인 주문</h2>
        <ol className="flex items-center justify-between rounded-lg bg-light px-5 py-5 lg:px-10 lg:py-7">
          {PROGRESS.map((status, i) => {
            const count = orders.filter((o) => o.status === status).length
            return (
              <li key={status} className="flex items-center gap-3 lg:contents">
                {i > 0 && <img src={chevronRightWeak} alt="" className="size-4" />}
                <a href={accioHref('/mypage/orders')} className="flex flex-col items-center gap-1">
                  <span className={`text-20 font-semibold tabular-nums lg:text-28 ${count ? 'text-main' : 'text-disabled'}`}>{count}</span>
                  <span className="text-12 text-sub lg:text-14">{status}</span>
                </a>
              </li>
            )
          })}
        </ol>
      </section>

      {/* 모바일 메뉴 목록 */}
      <nav aria-label="마이페이지 메뉴" className="flex flex-col lg:hidden">
        {MY_MENU.flatMap((g) => g.items).map((item) => (
          <a key={item.path} href={accioHref(item.path)} className="flex items-center justify-between border-b border-light py-4 text-16 text-main">
            {item.label}
            <img src={chevronRightWeak} alt="" className="size-5" />
          </a>
        ))}
        {user && (
          <button type="button" onClick={authActions.logout} className="border-b border-light py-4 text-left text-16 text-sub-weak">
            로그아웃
          </button>
        )}
      </nav>

      {/* 최근 주문 (PC) */}
      {latest && (
        <section aria-label="최근 주문" className="hidden flex-col gap-4 lg:flex">
          <div className="flex items-center justify-between">
            <h2 className="text-20 font-semibold text-main">최근 주문</h2>
            <a href={accioHref('/mypage/orders')} className="flex items-center text-14 font-medium text-sub-weak">
              전체 보기
              <img src={chevronRightWeak} alt="" className="size-4" />
            </a>
          </div>
          <OrderCard order={latest} />
        </section>
      )}

      {/* 최근 본 상품 (PC) */}
      {recent.length > 0 && (
        <section aria-label="최근 본 상품" className="hidden flex-col gap-4 lg:flex">
          <h2 className="text-20 font-semibold text-main">최근 본 상품</h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-none">
            {recent.slice(0, 6).map((v) => {
              const product = findProduct(v.productId)
              return product ? (
                <a key={v.productId} href={productHref(product)} aria-label={product.name} className="shrink-0">
                  <img src={product.image} alt="" className="size-[150px] rounded-md object-cover" />
                </a>
              ) : null
            })}
          </div>
        </section>
      )}
    </MyLayout>
  )
}

const PERIODS = [
  { label: '3개월', days: 90 },
  { label: '6개월', days: 180 },
  { label: '1년', days: 365 },
  { label: '전체', days: Infinity },
]

/** 주문내역 (Figma PC 427:1989 · MO 427:2222) — 기간으로 거르고, 상태마다 할 수 있는 일이 다르다 */
export function OrdersPage() {
  const orders = useOrders()
  const [period, setPeriod] = useState(PERIODS[0])
  // 렌더할 때마다 다른 값을 내지 않게, 화면을 연 시각을 기준으로 거른다
  const [now] = useState(() => Date.now())
  const visible = orders.filter((o) => now - new Date(o.orderedAt).getTime() <= period.days * 86_400_000)

  return (
    <MyLayout
      path="/mypage/orders"
      title="주문내역"
      aside={
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setPeriod(p)}
              aria-pressed={p === period}
              className={`rounded-full px-3.5 py-1.5 text-13 ${p === period ? 'bg-main font-semibold text-white' : 'border border-regular font-medium text-sub'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      }
    >
      {visible.length > 0 ? (
        <div className="flex flex-col gap-3 lg:gap-4">
          {visible.map((order) => (
            <OrderCard key={order.no} order={order} />
          ))}
        </div>
      ) : (
        // 주문내역 빈 상태 (상태 시안 439:3328) — 기간 필터로 0건이면 문구만 '이 기간에는'으로
        <Empty
          icon="box"
          title={orders.length === 0 ? '아직 주문한 상품이 없어요' : '이 기간에는 주문한 상품이 없어요'}
          description="AI에게 필요한 걸 말해 보세요"
          action={{ label: 'AI로 찾아보기', path: '/ai' }}
        />
      )}
    </MyLayout>
  )
}

const CLAIM_BADGE: Record<ClaimStatus, string> = {
  접수: 'bg-regular text-sub',
  승인: 'bg-status-success-soft text-status-success',
  완료: 'bg-regular font-semibold text-main',
  거절: 'bg-status-error-soft text-status-error',
}

/** 취소·반품 내역 (Figma PC 429:2281 · MO 429:2531) — 접수 → 승인 → 완료(또는 거절) */
export function ClaimsPage() {
  const claims = useClaims()

  return (
    <MyLayout path="/mypage/claims" title="취소·반품 내역">
      {claims.length === 0 && <Empty icon="box" title="취소·반품 신청이 없어요" />}
      <div className="flex flex-col gap-3 lg:gap-4">
        {claims.map((claim) => {
          const product = findProduct(claim.productId)
          if (!product) return null
          const steps: ClaimStatus[] = ['접수', claim.status === '거절' ? '거절' : '승인', ...(claim.status === '거절' ? [] : (['완료'] as ClaimStatus[]))]
          const reached = steps.indexOf(claim.status)
          return (
            <article key={claim.id} className="flex flex-col gap-3.5 rounded-lg border border-regular px-4 py-4 lg:px-6 lg:py-5">
              <p className="flex items-center gap-1.5 text-12">
                <span className="rounded-[6px] bg-regular px-2 py-[3px] font-semibold text-sub">{claim.type}</span>
                <span className={`rounded-[6px] px-2 py-[3px] font-semibold ${CLAIM_BADGE[claim.status]}`}>{claim.status}</span>
                <span className="ml-1 text-sub-weak tabular-nums">{formatDate(claim.requestedAt)} 신청</span>
              </p>
              <div className="flex items-center gap-3">
                <img src={product.image} alt="" className="size-14 rounded-[10px] object-cover" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-14 text-main">{product.fullName ?? product.name}</p>
                  <p className="text-12 text-sub-weak">
                    사유: {claim.reason}
                    {claim.detail && ` · ${claim.detail}`}
                  </p>
                </div>
              </div>
              <ol className="flex items-center gap-2 text-12" aria-label="진행 단계">
                {steps.map((step, i) => {
                  const done = i <= reached
                  const isReject = step === '거절'
                  return (
                    <li key={step} className="flex items-center gap-2">
                      {i > 0 && <span aria-hidden className={`h-px w-10 lg:w-16 ${done ? 'bg-black' : 'bg-regular'}`} />}
                      <span
                        aria-hidden
                        className={`size-1.5 rounded-full ${isReject ? 'bg-status-error' : done ? 'bg-black' : 'border border-disabled'}`}
                      />
                      <span className={done ? 'font-semibold text-main' : 'text-sub-weak'} aria-current={i === reached ? 'step' : undefined}>
                        {step}
                      </span>
                    </li>
                  )
                })}
              </ol>
              {claim.rejectReason && (
                <div className="rounded-md bg-status-error-soft px-3.5 py-2.5 text-13">
                  <p className="font-semibold text-status-error">거절 사유</p>
                  <p className="text-main">{claim.rejectReason}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="flex items-baseline gap-2">
                  <span className="text-12 text-sub-weak">{claim.status === '거절' ? '환불 없음' : '환불 예정'}</span>
                  <span className="text-16 font-semibold text-main tabular-nums">{claim.status === '거절' ? '-' : formatWon(claim.refund)}</span>
                </p>
                {claim.status === '접수' && (
                  <button
                    type="button"
                    onClick={() => orderActions.withdraw(claim)}
                    className="flex h-9 min-w-30 items-center justify-center rounded-md border border-regular px-3.5 text-14 font-semibold text-main"
                  >
                    신청 철회
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </MyLayout>
  )
}

/** 자주 산 상품 (Figma PC 430:2704 · MO 430:2883) — 다시 살 때가 된 상품을 맨 위에 */
export function ReorderPage() {
  const [added, setAdded] = useState<string[]>([])
  const items = FREQUENT_PURCHASES.map((f) => ({ ...f, product: findProduct(f.productId) })).filter(
    (f): f is typeof f & { product: NonNullable<typeof f.product> } => !!f.product,
  )
  const due = [...items].sort((a, b) => b.daysSince / b.cycleDays - a.daysSince / a.cycleDays)[0]
  const add = (id: string) => {
    const product = findProduct(id)
    if (!product) return
    cartActions.add(product, '기본', 1)
    setAdded((list) => [...list, id])
  }
  const addLabel = (id: string) => (added.includes(id) ? '담았어요' : '다시 담기')

  return (
    <MyLayout path="/mypage/reorder" title="자주 산 상품">
      {due && (
        <section className="flex items-center gap-3 rounded-lg bg-light px-4 py-4">
          <img src={due.product.image} alt="" className="size-13 rounded-sm object-cover" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="flex items-center gap-1 text-12 text-sub">
              <AiDot size={9} />
              다시 살 때가 됐어요
            </p>
            <p className="truncate text-15 font-semibold text-main">{due.product.name}</p>
            <p className="text-12 text-sub-weak">
              평균 {due.cycleDays}일마다 샀어요 · 마지막 구매 {due.daysSince}일 전
            </p>
          </div>
          <Button variant="primary" onClick={() => add(due.productId)} className="h-10 shrink-0 px-4 text-15">
            {addLabel(due.productId)}
          </Button>
        </section>
      )}
      <ul>
        {items.map((f) => (
          <li key={f.productId} className="flex items-center gap-3 border-b border-light py-4">
            <a href={productHref(f.product)} className="shrink-0">
              <img src={f.product.image} alt="" className="size-[60px] rounded-sm object-cover lg:size-[72px]" />
            </a>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <a href={productHref(f.product)} className="truncate text-14 text-main">
                {f.product.name}
              </a>
              <p className="text-12 text-sub-weak">
                {f.count}번 구매 · 마지막 {f.last}
              </p>
              <p className="text-15 font-semibold text-main tabular-nums">{formatWon(f.product.price)}</p>
            </div>
            <button
              type="button"
              onClick={() => add(f.productId)}
              className="flex h-10 shrink-0 items-center justify-center rounded-md border border-regular px-4 text-15 font-semibold text-main lg:w-[83px]"
            >
              {addLabel(f.productId)}
            </button>
          </li>
        ))}
      </ul>
    </MyLayout>
  )
}

/** 찜 (Figma PC 429:1961 · MO 429:2199) — 편집에서 골라 지우거나 한 번에 담는다 */
export function WishlistPage() {
  const wishlist = useWishlist()
  const [editing, setEditing] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const products = wishlist.ids.map(findProduct).filter((p): p is NonNullable<typeof p> => !!p)
  const toggle = (id: string) => setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
  const finish = () => {
    setEditing(false)
    setPicked([])
  }

  return (
    <MyLayout
      path="/mypage/wishlist"
      title={`찜 ${products.length}`}
      aside={
        products.length > 0 && (
          <div className="flex gap-4 text-14">
            {editing ? (
              <>
                <button
                  type="button"
                  disabled={picked.length === 0}
                  onClick={() => {
                    products.filter((p) => picked.includes(p.id)).forEach((p) => cartActions.add(p, '기본', 1))
                    finish()
                  }}
                  className="text-main disabled:text-disabled"
                >
                  선택 담기
                </button>
                <button
                  type="button"
                  disabled={picked.length === 0}
                  onClick={() => {
                    wishlist.remove(picked)
                    finish()
                  }}
                  className="text-status-error disabled:text-disabled"
                >
                  선택 삭제
                </button>
                <button type="button" onClick={finish} className="font-semibold text-main">
                  완료
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setEditing(true)} className="text-main">
                  선택 담기
                </button>
                <button type="button" onClick={() => setEditing(true)} className="text-main">
                  편집
                </button>
              </>
            )}
          </div>
        )
      }
    >
      {products.length === 0 ? (
        <Empty icon="heart" title="찜한 상품이 없어요" description="상품의 하트를 눌러 모아 보세요" action={{ label: '인기 상품 보기', path: '/list' }} />
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-8">
          {products.map((product) => (
            <div key={product.id} className="relative flex flex-col gap-3">
              <ProductCard product={product} />
              {editing && (
                <label className="absolute top-2 left-2 z-20 cursor-pointer rounded-[6px] bg-white/80 p-0.5">
                  <input type="checkbox" checked={picked.includes(product.id)} onChange={() => toggle(product.id)} className="sr-only" aria-label={`${product.name} 고르기`} />
                  <CheckMark checked={picked.includes(product.id)} />
                </label>
              )}
              <button
                type="button"
                onClick={() => cartActions.add(product, '기본', 1)}
                className="flex h-9 items-center justify-center rounded-md border border-regular text-14 font-semibold text-main"
              >
                장바구니 담기
              </button>
            </div>
          ))}
        </div>
      )}
    </MyLayout>
  )
}

/** '오늘' · '어제' · 'MM.DD' */
function dayLabel(ms: number) {
  const startOfToday = new Date().setHours(0, 0, 0, 0)
  if (ms >= startOfToday) return '오늘'
  if (ms >= startOfToday - 86_400_000) return '어제'
  const d = new Date(ms)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

/** 최근 본 상품 (Figma PC 430:2455 · MO 430:2637) — 날짜별로 묶고 하나씩 또는 전체 지운다 */
export function RecentPage() {
  const recent = useRecentViews()
  const groups = recent.reduce<{ label: string; items: typeof recent }[]>((acc, v) => {
    const label = dayLabel(v.viewedAt)
    const last = acc[acc.length - 1]
    if (last?.label === label) last.items.push(v)
    else acc.push({ label, items: [v] })
    return acc
  }, [])

  return (
    <MyLayout
      path="/mypage/recent"
      title="최근 본 상품"
      aside={
        recent.length > 0 && (
          <button type="button" onClick={recentActions.clear} className="text-14 text-sub">
            전체 삭제
          </button>
        )
      }
    >
      {recent.length === 0 && <Empty icon="box" title="최근 본 상품이 없어요" description="상품을 보면 여기에 차례로 남아요" action={{ label: '인기 상품 보기', path: '/list' }} />}
      {groups.map((group) => (
        <section key={group.label} aria-label={group.label} className="flex flex-col">
          <h2 className="pb-1 text-15 font-semibold text-main">{group.label}</h2>
          {group.items.map((v) => {
            const product = findProduct(v.productId)
            if (!product) return null
            const time = new Date(v.viewedAt)
            return (
              <div key={v.productId} className="flex items-center gap-3 border-b border-light py-3.5">
                <a href={productHref(product)} className="flex min-w-0 flex-1 items-center gap-3">
                  <img src={product.image} alt="" className="size-[50px] shrink-0 rounded-sm object-cover" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-14 text-main">{product.fullName ?? product.name}</span>
                    <span className="text-12 text-sub-weak tabular-nums">
                      {String(time.getHours()).padStart(2, '0')}:{String(time.getMinutes()).padStart(2, '0')} · {product.brand}
                    </span>
                    <span className="text-15 font-semibold text-main tabular-nums">{formatWon(product.price)}</span>
                  </span>
                </a>
                <button type="button" onClick={() => recentActions.remove(v.productId)} aria-label={`${product.name} 지우기`} className="p-1">
                  <img src={close14Weak} alt="" className="size-3.5" />
                </button>
              </div>
            )
          })}
        </section>
      ))}
    </MyLayout>
  )
}

/** 별점 고르기 — 큰 별 다섯 개 */
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div role="radiogroup" aria-label="별점" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n}점`}
          onClick={() => onChange(n)}
          className={`text-28 leading-none ${n <= value ? 'text-main' : 'text-icon-disabled'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

const MIN_REVIEW = 10
const MAX_REVIEW = 500

/** 내 리뷰 (Figma PC 429:2665 · MO 429:2872) — 작성 가능한 상품에 바로 쓰고, 쓴 리뷰는 고치거나 지운다 */
export function ReviewsPage() {
  const writable = useWritableReviews()
  const reviews = useMyReviews()
  const [tab, setTab] = useState<'write' | 'written'>('write')
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null)
  const target = writable[0]
  const tooShort = body.trim().length < MIN_REVIEW

  const submit = () => {
    if (!target || tooShort) return
    reviewActions.write({ productId: target.line.productId, orderNo: target.order.no, rating, body: body.trim(), photos: photos.length })
    setBody('')
    setPhotos([])
    setRating(5)
    setTab('written')
  }

  return (
    <MyLayout path="/mypage/reviews" title="내 리뷰">
      <div role="tablist" className="flex border-b border-regular">
        {(
          [
            ['write', `작성 가능 ${writable.length}`],
            ['written', `작성한 리뷰 ${reviews.length}`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex-1 pt-3 text-15 ${tab === key ? 'border-b-2 border-black pb-2.5 font-semibold text-main' : 'pb-3 text-sub-weak'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'write' &&
        (target ? (
          (() => {
            const product = findProduct(target.line.productId)
            if (!product) return null
            return (
              <section aria-label="리뷰 쓰기" className="flex flex-col gap-4 rounded-lg border-[1.5px] border-black px-4 py-5 lg:px-5">
                <div className="flex items-center gap-3">
                  <img src={product.image} alt="" className="size-12 rounded-sm object-cover" />
                  <div className="flex min-w-0 flex-col">
                    <p className="truncate text-14 text-main">{product.fullName ?? product.name}</p>
                    <p className="text-12 text-sub-weak tabular-nums">
                      {formatDate(target.order.orderedAt).slice(5)} 구매 · {target.line.quantity}개
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-14 font-semibold text-main">상품은 어떠셨나요?</p>
                  <StarPicker value={rating} onChange={setRating} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <textarea
                    value={body}
                    maxLength={MAX_REVIEW}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="좋았던 점, 아쉬운 점을 적어 주세요"
                    aria-label="리뷰 내용"
                    aria-invalid={body.length > 0 && tooShort}
                    className={`h-22 resize-none rounded-md px-4 py-3 text-14 text-main outline-none placeholder:text-disabled ${
                      body.length > 0 && tooShort ? 'border-[1.5px] border-status-error' : 'border border-regular focus:border-[1.5px] focus:border-black'
                    }`}
                  />
                  <p className="flex justify-between text-12">
                    <span className={body.length > 0 && tooShort ? 'text-status-error' : 'text-sub-weak'}>
                      {body.length > 0 && tooShort ? `${MIN_REVIEW}자 이상 ${MIN_REVIEW - body.trim().length}자 더 써 주세요` : `${MIN_REVIEW}자 이상 써 주세요`}
                    </span>
                    <span className="text-sub-weak tabular-nums">
                      {body.length} / {MAX_REVIEW}
                    </span>
                  </p>
                </div>
                <PhotoPicker photos={photos} onChange={setPhotos} />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setBody('')
                      setPhotos([])
                    }}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button variant="primary" disabled={tooShort} onClick={submit} className="flex-1">
                    등록하기
                  </Button>
                </div>
              </section>
            )
          })()
        ) : (
          <Empty icon="box" title="지금 쓸 수 있는 리뷰가 없어요" description="배송이 끝난 상품이 생기면 여기에 보여요" />
        ))}

      {(tab === 'written' || reviews.length > 0) && (
        <section aria-label="작성한 리뷰" className={`flex flex-col ${tab === 'write' ? 'hidden pt-6 lg:flex' : ''}`}>
          {tab === 'write' && <h2 className="pb-3 text-18 font-semibold text-main">작성한 리뷰 {reviews.length}</h2>}
          {reviews.map((review) => {
            const product = findProduct(review.productId)
            if (!product) return null
            const isEditing = editing?.id === review.id
            return (
              <article key={review.id} className="flex flex-col gap-2.5 border-t border-light py-5">
                <div className="flex items-center gap-3">
                  <img src={product.image} alt="" className="size-10 rounded-sm object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-14 text-main">{product.name}</p>
                    <p className="text-12 text-sub-weak tabular-nums">
                      {'★'.repeat(review.rating)} · {formatDate(review.writtenAt).slice(5)}
                    </p>
                  </div>
                  <div className="flex gap-3 text-13 text-sub">
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (editing.body.trim().length >= MIN_REVIEW) {
                            reviewActions.update(review.id, { rating: review.rating, body: editing.body.trim() })
                            setEditing(null)
                          }
                        }}
                        className="font-semibold text-main"
                      >
                        저장
                      </button>
                    ) : (
                      <button type="button" onClick={() => setEditing({ id: review.id, body: review.body })}>
                        수정
                      </button>
                    )}
                    <button type="button" onClick={() => reviewActions.remove(review.id)}>
                      삭제
                    </button>
                  </div>
                </div>
                {isEditing ? (
                  <textarea
                    value={editing.body}
                    onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                    aria-label="리뷰 고치기"
                    className="h-20 resize-none rounded-md border-[1.5px] border-black px-3 py-2 text-14 text-main outline-none"
                  />
                ) : (
                  <p className="text-14 text-main">{review.body}</p>
                )}
              </article>
            )
          })}
        </section>
      )}
    </MyLayout>
  )
}

/** 빈 화면 — 안내 + 다음 행동 */
function Empty({ icon, title, description, action }: { icon: 'box' | 'heart'; title: string; description?: string; action?: { label: string; path: string } }) {
  return (
    <StateEmpty
      icon={icon}
      title={title}
      description={description}
      action={action && { label: action.label, onClick: () => go(action.path) }}
      className="py-14 lg:py-20"
    />
  )
}

