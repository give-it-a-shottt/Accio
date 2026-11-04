import { useEffect, useMemo, useState } from 'react'
import chevronDownDark from '../assets/v4/icons/chevron-down-dark.svg'
import chevronRightWeak from '../assets/v4/icons/chevron-right-weak.svg'
import heart20On from '../assets/v4/icons/heart-20-on.svg'
import heartIcon from '../assets/v4/icons/heart.svg'
import thumbIcon from '../assets/v4/icons/thumb.svg'
import { ALL_PRODUCTS, PRODUCTS, type Product } from '../data/catalog'
import { getDetail, REVIEW_TOPICS, SHIPPING_INFO, type Review, type ReviewTopic } from '../data/detail'
import { accioHref } from '../routes'
import FloatingStack from '../ui/FloatingStack'
import ProductCard from '../ui/ProductCard'
import { AiDot, Button, Container, Stepper } from '../ui/primitives'
import SiteFooter from '../ui/SiteFooter'
import SiteHeader from '../ui/SiteHeader'
import { cartActions, findProduct } from '../ui/useCart'
import { StateEmpty } from '../ui/states'
import { showToast } from '../ui/toast'
import { recentActions } from '../ui/useMyData'
import useWishlist from '../ui/useWishlist'
import { formatCount, formatWon } from '../utils/format'

const TABS = ['상품 설명', '리뷰', '배송 · 교환'] as const
type Tab = (typeof TABS)[number]
const REVIEW_SORTS = ['AI 관련순', '최신순', '도움순'] as const

/** '★★★★★' — 점수만큼 채운 별 */
const stars = (rating: number) => '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))

/** 리뷰 한 건 — 강조어는 브랜드 진한 오렌지 */
function ReviewItem({ review, image }: { review: Review; image: string }) {
  const [helped, setHelped] = useState(false)
  const parts = review.highlight ? review.body.split(review.highlight) : [review.body]

  return (
    <article className="flex flex-col gap-2.5 border-t border-light py-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-12 text-main" aria-label={`별점 ${review.rating}점`}>
          {stars(review.rating)}
        </span>
        <span className="text-13 font-semibold text-main">{review.author}</span>
        <span className="text-12 text-sub-weak">{review.ago}</span>
        {review.aiPick && (
          <span className="flex items-center gap-[3px] rounded-xs bg-accio-soft px-1.5 py-0.5 text-11 font-semibold text-accio-strong">
            <AiDot size={8} />
            AI 추천
          </span>
        )}
      </div>
      <p className="text-12 text-sub-weak">{review.option}</p>
      <p className="text-14 text-main">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && <strong className="font-semibold text-accio-strong">{review.highlight}</strong>}
          </span>
        ))}
      </p>
      {review.photos ? (
        <div className="flex gap-1.5">
          {Array.from({ length: review.photos }, (_, i) => (
            <img key={i} src={image} alt={`리뷰 사진 ${i + 1}`} className="size-18 rounded-sm object-cover" loading="lazy" />
          ))}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setHelped((v) => !v)}
        aria-pressed={helped}
        className={`flex w-fit items-center gap-1 rounded-full border px-2.5 py-[5px] text-12 font-medium ${helped ? 'border-black text-main' : 'border-regular text-sub'}`}
      >
        <img src={thumbIcon} alt="" className="size-3.5" />
        도움돼요 {review.helpful + (helped ? 1 : 0)}
      </button>
    </article>
  )
}

// 이번 방문에서 이미 요약을 만든 상품 — 다시 열면 바로 보여 준다 (서버에 저장된 요약 흉내)
const summarizedIds = new Set<string>()

/**
 * AI 리뷰 요약 (상태 시안 438:3217) — 저장된 요약이 없으면 '리뷰 N개를 읽는 중…' 스켈레톤을 잠깐 보여 주고,
 * 인터넷이 끊겨 만들지 못하면 다시 시도 카드를 띄운다. 실패해도 아래 일반 리뷰는 그대로 보인다.
 */
function AiReviewSummary({ product, summary }: { product: Product; summary: ReturnType<typeof getDetail>['summary'] }) {
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>(() => (summarizedIds.has(product.id) ? 'done' : 'loading'))

  useEffect(() => {
    if (status !== 'loading') return
    const timer = window.setTimeout(() => {
      if (!navigator.onLine) return setStatus('error')
      summarizedIds.add(product.id)
      setStatus('done')
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [status, product.id])

  if (status === 'loading')
    return (
      <section aria-label="AI 리뷰 요약" aria-busy="true" className="flex flex-col gap-2.5 rounded-lg bg-light px-5 py-4.5 lg:px-6 lg:py-5">
        <p className="flex items-center gap-1.5 text-14 font-semibold text-main">
          <AiDot size={12} />
          리뷰 {formatCount(product.reviewCount)}개를 읽는 중…
        </p>
        {['w-[300px]', 'w-[260px]', 'w-[280px]', 'w-[180px]'].map((width) => (
          <span key={width} className={`h-3 max-w-full rounded-[6px] bg-white ${width}`} />
        ))}
      </section>
    )

  if (status === 'error')
    return (
      <section aria-label="AI 리뷰 요약" className="flex flex-col items-start gap-2.5 rounded-lg border border-regular px-5 py-4.5 lg:px-6 lg:py-5">
        <p className="flex items-center gap-1.5 text-14 font-semibold text-main">
          <AiDot size={12} muted />
          요약을 만들지 못했어요
        </p>
        <p className="text-13 text-sub">잠시 뒤 다시 눌러 주세요. 리뷰는 아래에서 그대로 볼 수 있어요.</p>
        <Button onClick={() => setStatus('loading')} className="h-12 min-w-30 px-5">
          다시 시도
        </Button>
      </section>
    )

  return (
    <section aria-label="AI 리뷰 요약" className="flex flex-col gap-3.5 rounded-lg bg-light px-6 py-5">
      <p className="flex items-center gap-1.5">
        <AiDot size={12} />
        <span className="text-14 font-semibold text-main">AI 리뷰 요약</span>
        <span className="text-12 text-sub-weak">리뷰 {formatCount(product.reviewCount)}개 기준</span>
      </p>
      <p className="text-15 text-main">{summary.summary}</p>
      <div className="flex gap-3">
        {[
          ['좋아요', summary.pros],
          ['아쉬워요', summary.cons],
        ].map(([title, items]) => (
          <div key={title as string} className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-md bg-white px-4 py-3">
            <p className="text-13 font-semibold text-sub">{title}</p>
            {(items as string[]).map((item) => (
              <p key={item} className="text-14 text-main">
                · {item}
              </p>
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {summary.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-12 font-medium text-sub">
            {tag}
          </span>
        ))}
      </div>
    </section>
  )
}

function ReviewSection({ product, detail }: { product: Product; detail: ReturnType<typeof getDetail> }) {
  const [topic, setTopic] = useState<'전체' | ReviewTopic | '사진 리뷰'>('전체')
  const [sort, setSort] = useState<(typeof REVIEW_SORTS)[number]>('AI 관련순')
  const { summary } = detail

  const reviews = useMemo(() => {
    const filtered = detail.reviews.filter((r) =>
      topic === '전체' ? true : topic === '사진 리뷰' ? !!r.photos : r.topics.includes(topic),
    )
    const sorted = [...filtered]
    if (sort === 'AI 관련순') sorted.sort((a, b) => Number(!!b.aiPick) - Number(!!a.aiPick))
    if (sort === '최신순') sorted.sort((a, b) => a.daysAgo - b.daysAgo)
    if (sort === '도움순') sorted.sort((a, b) => b.helpful - a.helpful)
    return sorted
  }, [detail.reviews, topic, sort])

  // 리뷰 0개 (상태 시안 438:3176) — AI 요약은 숨기고 첫 리뷰를 권한다
  if (product.reviewCount === 0)
    return (
      <div className="flex flex-col gap-4 lg:mx-auto lg:max-w-[870px]">
        <StateEmpty icon="box" title="아직 리뷰가 없어요" description="첫 리뷰를 남기면 300P를 드려요" />
        <p className="flex items-center gap-2 rounded-[10px] bg-light px-3.5 py-3 text-12 text-sub-weak">
          <AiDot size={10} muted />
          리뷰가 5개 이상 모이면 AI 요약이 열려요
        </p>
      </div>
    )

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-12">
      {/* 평점 분포 (PC) */}
      <div className="hidden w-[282px] shrink-0 flex-col gap-2.5 lg:flex">
        <p className="text-48 font-semibold text-main">{product.rating.toFixed(1)}</p>
        <p className="text-14 text-sub">
          {stars(product.rating)}&nbsp;&nbsp;리뷰 {formatCount(product.reviewCount)}개
        </p>
        {summary.distribution.map((percent, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-7 text-12 text-sub">{5 - i}점</span>
            <span className="relative h-1.5 w-50 overflow-hidden rounded-[3px] bg-regular">
              <span className="absolute inset-y-0 left-0 rounded-[3px] bg-black" style={{ width: `${percent}%` }} />
            </span>
            <span className="text-12 text-sub-weak tabular-nums">{percent}%</span>
          </div>
        ))}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-5">
        <AiReviewSummary product={product} summary={summary} />

        {/* 주제 칩 · 정렬 */}
        <div className="flex items-center justify-between gap-3">
          <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 scrollbar-none lg:mx-0 lg:gap-2 lg:px-0">
            {(['전체', ...REVIEW_TOPICS, '사진 리뷰'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTopic(item)}
                aria-pressed={item === topic}
                className={`shrink-0 rounded-full px-3.5 py-[7px] text-13 whitespace-nowrap ${
                  item === topic ? 'bg-main font-semibold text-white' : 'border border-regular bg-white font-medium text-sub'
                }`}
              >
                {item === '사진 리뷰' ? (
                  <>
                    <span className="lg:hidden">사진</span>
                    <span className="hidden lg:inline">사진 리뷰</span>
                  </>
                ) : (
                  item
                )}
              </button>
            ))}
          </div>
          <label className="relative hidden shrink-0 items-center text-13 font-medium text-main lg:flex">
            <span className="sr-only">리뷰 정렬</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="appearance-none bg-transparent pr-4.5 outline-none">
              {REVIEW_SORTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <img src={chevronDownDark} alt="" className="pointer-events-none absolute right-0 size-4" />
          </label>
        </div>

        <div>
          {reviews.length > 0 ? (
            reviews.map((review) => <ReviewItem key={review.id} review={review} image={product.image} />)
          ) : (
            <p className="border-t border-light py-10 text-center text-14 text-sub">이 주제의 리뷰가 아직 없어요.</p>
          )}
        </div>
      </div>
    </div>
  )
}

/** 상세 표 (상품 설명 · 배송·교환 탭) */
function InfoTable({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[96px_1fr] border-t border-light text-14 lg:grid-cols-[160px_1fr]">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="border-b border-light bg-light px-4 py-3.5 text-sub">{label}</dt>
          <dd className="border-b border-light px-4 py-3.5 text-main">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * 상품 상세 (Figma PC 421:681 · MO 421:1049).
 * 갤러리 · 옵션(색상·사이즈) · 수량 · 장바구니/바로 구매, 탭(설명·리뷰·배송) 아래 AI 리뷰 요약과 주제별 리뷰.
 * 모바일은 아래 고정 구매 바에서 옵션 시트를 연다.
 */
export default function DetailPage({ productId }: { productId?: string }) {
  const product = productId ? findProduct(productId) : PRODUCTS.campingChair
  return product ? <DetailView product={product} /> : <DetailNotFound />
}

/** 없는 상품 (상태 시안 438:3160) — 판매가 끝났거나 숨긴 상품 링크로 들어왔을 때 */
function DetailNotFound() {
  return (
    <div className="flex min-h-svh flex-col bg-white">
      <SiteHeader mobileTitle="" />
      <main className="flex flex-1 items-center justify-center px-5 py-20 lg:py-40">
        <StateEmpty icon="alert" title="없는 상품이에요" description="판매가 끝났거나 주소가 잘못됐어요" action={{ label: '홈으로 가기', href: accioHref() }} />
      </main>
      <SiteFooter hideOnMobile />
    </div>
  )
}

function DetailView({ product }: { product: Product }) {
  const detail = useMemo(() => getDetail(product), [product])
  const soldOut = !!product.soldOut
  const { colors, sizes } = detail.options
  const wishlist = useWishlist()
  const liked = wishlist.has(product.id)
  // 연 상품은 '최근 본 상품' 맨 앞에 남긴다
  useEffect(() => recentActions.record(product.id), [product.id])

  const [imageIndex, setImageIndex] = useState(0)
  const [color, setColor] = useState(colors?.[0]?.name)
  const [size, setSize] = useState(sizes?.find((s) => !s.soldOut)?.name)
  const [quantity, setQuantity] = useState(1)
  const [tab, setTab] = useState<Tab>('리뷰')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [restockAlert, setRestockAlert] = useState(false)

  const gallery = Array.from({ length: 5 }, () => product.image)
  const optionLabel = [color, size].filter(Boolean).join(' / ') || '기본'
  const total = product.price * quantity
  const related = ALL_PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)

  const addToCart = () => {
    cartActions.add(product, optionLabel, quantity)
    setSheetOpen(false)
    showToast({ message: '장바구니에 담았어요', action: { label: '장바구니로 가기', href: accioHref('/cart') } })
  }
  const toggleRestock = () => {
    setRestockAlert((on) => !on)
    showToast({ message: restockAlert ? '재입고 알림을 껐어요' : '다시 들어오면 알림으로 알려 드릴게요' })
  }

  // 품절 (상태 시안 438:3200) — 구매 버튼은 끄고 재입고 알림만 받는다
  const soldOutButtons = (heightClass: string) => (
    <>
      <Button onClick={toggleRestock} aria-pressed={restockAlert} className={`flex-1 ${heightClass}`}>
        {restockAlert ? '알림 신청됨' : '재입고 알림 받기'}
      </Button>
      <Button variant="primary" disabled className={`flex-1 ${heightClass}`}>
        품절됐어요
      </Button>
    </>
  )
  const soldOutBadge = soldOut && (
    <span className="absolute top-3.5 left-3.5 rounded-[6px] bg-main px-2.5 py-1 text-12 font-semibold text-white">품절</span>
  )
  const buyNow = () => {
    cartActions.add(product, optionLabel, quantity)
    window.location.hash = accioHref('/cart')
  }

  const optionsBlock = (
    <>
      {colors && (
        <div className="flex flex-col gap-2.5">
          <p className="text-14 font-semibold text-main">색상: {color}</p>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(c.name)}
                aria-label={c.name}
                aria-pressed={c.name === color}
                className={`size-9 rounded-full border-2 ${c.name === color ? 'border-black' : 'border-transparent'}`}
                style={{ backgroundColor: c.swatch, backgroundClip: 'padding-box' }}
              />
            ))}
          </div>
        </div>
      )}
      {sizes && (
        <div className="flex flex-col gap-2.5">
          <p className="text-14 font-semibold text-main">사이즈</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s.name}
                type="button"
                disabled={s.soldOut}
                onClick={() => setSize(s.name)}
                aria-pressed={s.name === size}
                className={`rounded-[10px] px-4 py-2.5 text-14 ${
                  s.soldOut
                    ? 'border border-regular bg-light text-disabled'
                    : s.name === size
                      ? 'border-[1.5px] border-black font-semibold text-main'
                      : 'border border-regular text-main'
                }`}
              >
                {s.name}
                {s.soldOut && ' (품절)'}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between rounded-md bg-light px-4 py-3">
        <p className="text-14 font-medium text-main">{optionLabel}</p>
        <div className="flex items-center gap-4">
          <Stepper value={quantity} onChange={setQuantity} />
          <p className="text-15 font-semibold text-main tabular-nums">{formatWon(total)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-main">
        <p className="text-15 font-medium">총 상품 금액</p>
        <p className="text-24 font-semibold tabular-nums">{formatWon(total)}</p>
      </div>
    </>
  )

  const heartButton = (sizeClass: string) => (
    <button
      type="button"
      onClick={() => wishlist.toggle(product.id)}
      aria-pressed={liked}
      aria-label={liked ? '찜 해제' : '찜하기'}
      className={`flex shrink-0 items-center justify-center rounded-md border border-regular ${sizeClass}`}
    >
      <img src={liked ? heart20On : heartIcon} alt="" className="size-6" />
    </button>
  )

  return (
    <div className="min-h-svh bg-white">
      <SiteHeader mobileTitle="" />

      <main className="pb-35 lg:pb-30">
        {/* ── 갤러리 + 구매 정보 ── */}
        <Container className="max-lg:px-0 lg:pt-10">
          <div className="flex flex-col lg:flex-row lg:gap-12">
            {/* 갤러리 — PC 는 썸네일 세로줄 + 큰 사진, 모바일은 옆으로 넘기는 사진 */}
            <div className="hidden shrink-0 gap-3 lg:flex">
              <div className="flex flex-col gap-2">
                {gallery.map((image, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImageIndex(i)}
                    aria-label={`사진 ${i + 1}`}
                    aria-pressed={i === imageIndex}
                    className={`size-18 overflow-hidden rounded-sm ${i === imageIndex ? 'border-[1.5px] border-black' : ''}`}
                  >
                    <img src={image} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="relative">
                <img src={gallery[imageIndex]} alt={product.name} className="size-[588px] rounded-lg object-cover" />
                {soldOutBadge}
              </div>
            </div>
            <div className="relative lg:hidden">
              <div
                className="flex aspect-square snap-x snap-mandatory overflow-x-auto scrollbar-none"
                onScroll={(e) => setImageIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
              >
                {gallery.map((image, i) => (
                  <img key={i} src={image} alt={i === 0 ? product.name : ''} className="size-full shrink-0 snap-start object-cover" />
                ))}
              </div>
              {soldOutBadge}
              <p className="absolute right-5 bottom-3.5 rounded-full bg-black/35 px-2 py-[3px] text-11 font-medium text-white tabular-nums">
                {imageIndex + 1} / {gallery.length}
              </p>
            </div>

            {/* 구매 정보 */}
            <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-5 lg:gap-4 lg:p-0">
              <a href={accioHref('/list')} className="flex w-fit items-center gap-0.5 text-13 font-medium text-sub lg:text-14">
                {product.brand} 브랜드관
                <img src={chevronRightWeak} alt="" className="size-4" />
              </a>
              <h1 className="text-20 font-semibold text-main lg:text-24">{detail.title}</h1>
              <p className="flex items-center gap-1.5 lg:gap-2">
                {product.reviewCount > 0 ? (
                  <span className="flex items-center gap-1 text-main">
                    <span className="text-14">{stars(product.rating)}</span>
                    <span className="text-13 font-semibold lg:text-14">{product.rating.toFixed(1)}</span>
                  </span>
                ) : (
                  <span className="text-13 font-medium text-sub lg:text-14">새 상품</span>
                )}
                <button type="button" onClick={() => setTab('리뷰')} className="text-13 text-sub-weak lg:text-14">
                  리뷰 {formatCount(product.reviewCount)}
                </button>
              </p>
              <div className="hidden h-px bg-light lg:block" />
              <div className="flex flex-wrap items-baseline gap-x-1.5 lg:flex-col lg:items-start lg:gap-0.5">
                {product.discountRate > 0 && !soldOut && (
                  <p className="order-last text-13 text-disabled line-through lg:order-first lg:text-14">{formatWon(detail.listPrice)}</p>
                )}
                <p className="flex items-baseline gap-1.5 text-24 font-semibold lg:gap-2 lg:text-28">
                  {product.discountRate > 0 && !soldOut && <span className="text-accio-strong">{product.discountRate}%</span>}
                  <span className={`tabular-nums ${soldOut ? 'text-disabled' : 'text-main'}`}>{formatWon(product.price)}</span>
                </p>
              </div>
              <div className="flex flex-col gap-1 rounded-[10px] bg-light px-3.5 py-3 lg:gap-1.5 lg:rounded-md lg:px-4 lg:py-3.5">
                <p className="flex gap-4 text-13 lg:text-14">
                  <span className="hidden w-10 text-sub-weak lg:inline">배송</span>
                  <span className="font-medium text-main">
                    {product.delivery?.includes('무료배송') ? '무료배송' : '배송비 3,000원'} · 내일(금) 도착 예정
                  </span>
                </p>
                <p className="flex gap-4 text-12 lg:text-14">
                  <span className="text-sub-weak lg:w-10">적립</span>
                  <span className="text-sub-weak lg:font-medium lg:text-main">
                    {formatCount(detail.points)}P<span className="hidden lg:inline"> (1%)</span>
                  </span>
                </p>
              </div>

              <div className="hidden flex-col gap-4 lg:flex">
                {!soldOut && optionsBlock}
                <div className="flex gap-2">
                  {heartButton('size-14')}
                  {soldOut ? (
                    soldOutButtons('h-14')
                  ) : (
                    <>
                      <Button onClick={addToCart} className="h-14 flex-1">
                        장바구니
                      </Button>
                      <Button variant="primary" onClick={buyNow} className="h-14 flex-1">
                        바로 구매
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Container>

        <div aria-hidden className="h-2 bg-regular lg:hidden" />

        {/* ── 탭 ── */}
        <div className="sticky top-0 z-20 bg-white lg:mt-16">
          <Container className="max-lg:px-0">
            <div role="tablist" className="flex border-b border-regular">
              {TABS.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={item === tab}
                  onClick={() => setTab(item)}
                  className={`flex-1 pt-3.5 text-15 lg:pt-4 lg:text-16 ${item === tab ? 'border-b-2 border-black pb-2.5 font-semibold text-main lg:pb-3' : 'pb-3 text-sub-weak lg:pb-3.5'}`}
                >
                  {item === '리뷰' ? `리뷰 ${formatCount(product.reviewCount)}` : item === '상품 설명' ? (
                    <>
                      <span className="lg:hidden">설명</span>
                      <span className="hidden lg:inline">상품 설명</span>
                    </>
                  ) : (
                    <>
                      <span className="lg:hidden">배송·교환</span>
                      <span className="hidden lg:inline">배송 · 교환</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </Container>
        </div>

        <Container className="pt-5 lg:pt-16">
          {tab === '리뷰' && <ReviewSection product={product} detail={detail} />}
          {tab === '상품 설명' && (
            <div className="flex flex-col gap-6 lg:mx-auto lg:max-w-[870px]">
              <div className="flex flex-col gap-2 text-15 text-main">
                {detail.description.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <img src={product.image} alt="" className="w-full rounded-lg object-cover" />
              <InfoTable rows={detail.specs} />
            </div>
          )}
          {tab === '배송 · 교환' && (
            <div className="lg:mx-auto lg:max-w-[870px]">
              <InfoTable rows={SHIPPING_INFO} />
            </div>
          )}

          {related.length > 0 && (
            <section aria-label="함께 보면 좋은 상품" className="hidden flex-col gap-5 pt-16 lg:flex">
              <h2 className="text-24 font-semibold text-main">함께 보면 좋은 상품</h2>
              <div className="grid grid-cols-4 gap-6">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </Container>
      </main>

      <SiteFooter hideOnMobile />
      <FloatingStack />

      {/* ── 모바일 고정 구매 바 ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-light bg-white px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] lg:hidden">
        {soldOut ? (
          soldOutButtons('h-12')
        ) : (
          <>
            {heartButton('size-13')}
            <Button variant="primary" onClick={() => setSheetOpen(true)} className="h-13 flex-1">
              구매하기
            </Button>
          </>
        )}
      </div>

      {/* ── 모바일 옵션 시트 ── */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 lg:hidden" onClick={() => setSheetOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="옵션 선택"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85svh] flex-col gap-4 overflow-y-auto rounded-t-xl bg-white px-5 pt-5 pb-[calc(12px+env(safe-area-inset-bottom))]"
          >
            {optionsBlock}
            <div className="flex gap-2">
              <Button onClick={addToCart} className="h-13 flex-1">
                장바구니
              </Button>
              <Button variant="primary" onClick={buyNow} className="h-13 flex-1">
                바로 구매
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
