import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import chevronDownDark from '../assets/v4/icons/chevron-down-dark.svg'
import chevronDown from '../assets/v4/icons/chevron-down.svg'
import chevronRightBrand from '../assets/v4/icons/chevron-right-brand.svg'
import chevronRightWeak from '../assets/v4/icons/chevron-right-weak.svg'
import close14Weak from '../assets/v4/icons/close-14-weak.svg'
import close14 from '../assets/v4/icons/close-14.svg'
import filterIcon from '../assets/v4/icons/filter.svg'
import { ALL_PRODUCTS, DELIVERY_OPTIONS, POPULAR_KEYWORDS, type Delivery, type Product } from '../data/catalog'
import { accioHref } from '../routes'
import FloatingStack from '../ui/FloatingStack'
import MobileTabBar from '../ui/MobileTabBar'
import ProductCard from '../ui/ProductCard'
import { AiDot, Button, CheckMark, Container } from '../ui/primitives'
import SiteFooter from '../ui/SiteFooter'
import SiteHeader from '../ui/SiteHeader'
import { StateEmpty } from '../ui/states'
import { chatActions, openAiWidget } from '../ui/useAiChat'
import { formatCount, formatWon } from '../utils/format'

const SORTS = ['관련도순', '인기순', '낮은 가격순', '높은 가격순'] as const
type Sort = (typeof SORTS)[number]

const PAGE_SIZE = 9
const PRICE_MIN = 0
const PRICE_MAX = 150000
const PRICE_STEP = 1000

interface Filters {
  categories: string[]
  brands: string[]
  delivery: Delivery[]
  price: [number, number]
}

const EMPTY_FILTERS: Filters = { categories: [], brands: [], delivery: [], price: [PRICE_MIN, PRICE_MAX] }

/** 검색어가 상품명·브랜드·분야 중 하나에 들어가면 결과로 본다. 띄어쓰기로 나눈 말이 모두 들어가야 한다 */
function matches(product: Product, query: string) {
  const haystack = `${product.name} ${product.brand} ${product.category}`.toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word))
}

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
const manwon = (won: number) => `${won / 10000}만`

function countBy(products: Product[], key: (p: Product) => string) {
  const counts = new Map<string, number>()
  products.forEach((p) => counts.set(key(p), (counts.get(key(p)) ?? 0) + 1))
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

function CheckRow({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: string; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <CheckMark checked={checked} />
      <span className={`text-14 ${checked ? 'text-main' : 'text-sub'}`}>{label}</span>
      {count !== undefined && <span className="text-12 text-disabled tabular-nums">{formatCount(count)}</span>}
    </label>
  )
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col gap-3 border-t border-light py-5">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex items-center justify-between">
        <span className="text-15 font-semibold text-main">{title}</span>
        <img src={chevronDown} alt="" className={`size-4 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && children}
    </div>
  )
}

/** 가격 범위 — 손잡이 두 개짜리 막대 + 금액 칸 */
function PriceRange({ value, onChange }: { value: [number, number]; onChange: (v: [number, number]) => void }) {
  const [low, high] = value
  const percent = (n: number) => ((n - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100
  const thumb =
    'pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:bg-white'

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-5">
        <div className="absolute inset-x-0 top-2 h-1 rounded-[2px] bg-regular" />
        <div className="absolute top-2 h-1 bg-black" style={{ left: `${percent(low)}%`, right: `${100 - percent(high)}%` }} />
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={low}
          onChange={(e) => onChange([Math.min(+e.target.value, high - PRICE_STEP), high])}
          aria-label="최저 가격"
          className={thumb}
        />
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={high}
          onChange={(e) => onChange([low, Math.max(+e.target.value, low + PRICE_STEP)])}
          aria-label="최고 가격"
          className={thumb}
        />
      </div>
      <div className="flex items-center gap-2 text-13">
        <span className="flex-1 rounded-sm border border-regular px-3 py-2.5 text-main tabular-nums">{formatWon(low)}</span>
        <span className="text-sub-weak">~</span>
        <span className="flex-1 rounded-sm border border-regular px-3 py-2.5 text-main tabular-nums">{formatWon(high)}</span>
      </div>
    </div>
  )
}

/** PC 왼쪽 필터 · 모바일 필터 시트에서 같이 쓰는 필터 본문 */
function FilterPanel({ base, filters, setFilters }: { base: Product[]; filters: Filters; setFilters: (f: Filters) => void }) {
  return (
    <>
      <FilterGroup title="카테고리">
        {countBy(base, (p) => p.category).map(([category, count]) => (
          <CheckRow
            key={category}
            label={category}
            count={count}
            checked={filters.categories.includes(category)}
            onChange={() => setFilters({ ...filters, categories: toggle(filters.categories, category) })}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="브랜드">
        {countBy(base, (p) => p.brand).map(([brand, count]) => (
          <CheckRow
            key={brand}
            label={brand}
            count={count}
            checked={filters.brands.includes(brand)}
            onChange={() => setFilters({ ...filters, brands: toggle(filters.brands, brand) })}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="배송">
        {DELIVERY_OPTIONS.map((option) => (
          <CheckRow
            key={option}
            label={option}
            checked={filters.delivery.includes(option)}
            onChange={() => setFilters({ ...filters, delivery: toggle(filters.delivery, option) })}
          />
        ))}
      </FilterGroup>
      <div className="flex flex-col gap-3 border-t border-light py-5">
        <p className="text-15 font-semibold text-main">가격</p>
        <PriceRange value={filters.price} onChange={(price) => setFilters({ ...filters, price })} />
      </div>
    </>
  )
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null
  const cell = 'flex size-9 items-center justify-center rounded-sm text-14 tabular-nums'
  return (
    <nav aria-label="페이지" className="flex justify-center gap-1.5 pt-6">
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="이전 페이지" className={`${cell} text-sub disabled:opacity-40`}>
        ‹
      </button>
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`${cell} ${n === page ? 'bg-main font-semibold text-white' : 'text-sub hover:bg-light'}`}
        >
          {n}
        </button>
      ))}
      <button type="button" disabled={page === total} onClick={() => onChange(page + 1)} aria-label="다음 페이지" className={`${cell} text-sub disabled:opacity-40`}>
        ›
      </button>
    </nav>
  )
}

/**
 * 상품 목록·검색 (Figma PC 418:378 · MO 418:745).
 * 검색어(#/accio/list?q=…)로 거른 뒤 왼쪽 필터(카테고리·브랜드·배송·가격)와 정렬, 9개씩 페이지를 나눈다.
 * 모바일은 필터를 아래에서 올라오는 시트로 연다.
 */
export default function ListPage({ query = '' }: { query?: string }) {
  const [draft, setDraft] = useState(query)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [sort, setSort] = useState<Sort>('관련도순')
  const [page, setPage] = useState(1)
  const [sheetOpen, setSheetOpen] = useState(false)

  const base = useMemo(() => (query ? ALL_PRODUCTS.filter((p) => matches(p, query)) : ALL_PRODUCTS), [query])

  const results = useMemo(() => {
    const [low, high] = filters.price
    const filtered = base.filter(
      (p) =>
        (filters.categories.length === 0 || filters.categories.includes(p.category)) &&
        (filters.brands.length === 0 || filters.brands.includes(p.brand)) &&
        filters.delivery.every((d) => p.delivery?.includes(d)) &&
        p.price >= low &&
        p.price <= high,
    )
    const sorted = [...filtered]
    if (sort === '인기순') sorted.sort((a, b) => b.reviewCount - a.reviewCount)
    if (sort === '낮은 가격순') sorted.sort((a, b) => a.price - b.price)
    if (sort === '높은 가격순') sorted.sort((a, b) => b.price - a.price)
    // 관련도순: AI 추천 상품을 맨 앞에
    if (sort === '관련도순') sorted.sort((a, b) => Number(!!b.aiPick) - Number(!!a.aiPick))
    return sorted
  }, [base, filters, sort])

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const visible = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const updateFilters = (next: Filters) => {
    setFilters(next)
    setPage(1)
  }

  // 지금 걸린 조건을 칩으로 — 누르면 그 조건만 푼다
  const priceActive = filters.price[0] !== PRICE_MIN || filters.price[1] !== PRICE_MAX
  const activeChips: { label: string; remove: () => void }[] = [
    ...filters.categories.map((c) => ({ label: c, remove: () => updateFilters({ ...filters, categories: toggle(filters.categories, c) }) })),
    ...filters.brands.map((b) => ({ label: b, remove: () => updateFilters({ ...filters, brands: toggle(filters.brands, b) }) })),
    ...filters.delivery.map((d) => ({ label: d, remove: () => updateFilters({ ...filters, delivery: toggle(filters.delivery, d) }) })),
    ...(priceActive
      ? [{ label: `${manwon(filters.price[0])}~${manwon(filters.price[1])}원`, remove: () => updateFilters({ ...filters, price: EMPTY_FILTERS.price }) }]
      : []),
  ]

  // 0건일 때 권할 검색어 — 검색어 앞 두 단어로 줄인 것과 인기 검색어 중 결과가 있는 것만
  const suggestions = useMemo(() => {
    const shortened = query.split(/\s+/).slice(0, 2).join(' ')
    const candidates = [...new Set([shortened, ...query.split(/\s+/), ...POPULAR_KEYWORDS])].filter((k) => k && k !== query)
    return candidates.filter((k) => ALL_PRODUCTS.some((p) => matches(p, k))).slice(0, 4)
  }, [query])

  const search = (e: FormEvent) => {
    e.preventDefault()
    const q = draft.trim()
    window.location.hash = q ? `${accioHref('/list')}?q=${encodeURIComponent(q)}` : accioHref('/list')
  }
  // 보던 목록 위에서 AI 위젯을 열고, 지금 검색어로 대화를 시작한다
  const askAi = () => {
    chatActions.startNew()
    chatActions.send(query || draft || '캠핑 갈 때 쓸 가벼운 의자 찾아줘')
    openAiWidget()
  }

  return (
    <div className="min-h-svh bg-white">
      <SiteHeader mobileTitle={query || '전체 상품'} />

      <main>
        <Container className="flex flex-col gap-4 pt-4 pb-30 lg:gap-8 lg:pt-10">
          {/* ── 제목 (PC) ── */}
          <div className="hidden flex-col gap-3 lg:flex">
            <p className="flex items-center gap-1 text-13 text-sub-weak">
              <a href={accioHref()}>홈</a>
              <img src={chevronRightWeak} alt="" className="size-4" />
              {query ? '검색 결과' : '전체 상품'}
            </p>
            <h1 className="flex items-baseline gap-2">
              <span className="text-28 font-semibold text-main">{query ? `‘${query}’` : '전체 상품'}</span>
              <span className="text-18 text-sub-weak">
                {query ? '검색 결과 ' : ''}
                {formatCount(results.length)}개
              </span>
            </h1>
          </div>

          {/* ── 검색창 (모바일) ── */}
          <form role="search" onSubmit={search} className="flex h-11 items-center gap-2 rounded-full bg-light pr-3.5 pl-4 lg:hidden">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="상품명이나 원하는 걸 말로 검색"
              aria-label="상품 검색"
              className="min-w-0 flex-1 bg-transparent text-15 text-main outline-none placeholder:text-disabled"
            />
            {draft && (
              <button type="button" onClick={() => setDraft('')} aria-label="검색어 지우기">
                <img src={close14Weak} alt="" className="size-3.5" />
              </button>
            )}
          </form>

          {/* ── AI 제안 ── */}
          <div className="flex items-center gap-2 rounded-[10px] bg-light py-2.5 pr-3 pl-3.5 lg:gap-4 lg:rounded-md lg:py-3.5 lg:pr-4 lg:pl-5">
            <span className="flex lg:hidden">
              <AiDot size={12} />
            </span>
            <span className="hidden lg:flex">
              <AiDot size={14} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-13 font-medium text-main lg:text-14 lg:font-semibold">
                <span className="lg:hidden">조건을 말로 하면 더 정확해요</span>
                <span className="hidden lg:inline">조건이 더 있나요? AI에게 말로 물어보면 더 정확해요</span>
              </p>
              <p className="hidden text-13 text-sub-weak lg:block">예) “등받이 높고 2kg 이하, 5만원 안쪽”</p>
            </div>
            <button type="button" onClick={askAi} className="flex items-center text-13 font-semibold text-accio-strong lg:hidden">
              AI 검색
              <img src={chevronRightBrand} alt="" className="size-4" />
            </button>
            <Button onClick={askAi} className="hidden lg:flex">
              AI로 다시 찾기
            </Button>
          </div>

          {/* ── 필터 칩 · 정렬 (모바일) ── */}
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 scrollbar-none lg:hidden">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex shrink-0 items-center gap-1 rounded-full border border-black py-1.5 pr-3 pl-2.5 text-13 font-semibold text-main"
            >
              <img src={filterIcon} alt="" className="size-5" />
              필터{activeChips.length > 0 && ` ${activeChips.length}`}
            </button>
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.remove}
                aria-label={`${chip.label} 조건 빼기`}
                className="shrink-0 rounded-full bg-main px-3.5 py-[7px] text-13 font-semibold whitespace-nowrap text-white"
              >
                {chip.label}
              </button>
            ))}
            {!priceActive && (
              <button type="button" onClick={() => setSheetOpen(true)} className="shrink-0 rounded-full border border-regular px-3.5 py-[7px] text-13 font-medium text-sub">
                가격
              </button>
            )}
            {filters.brands.length === 0 && (
              <button type="button" onClick={() => setSheetOpen(true)} className="shrink-0 rounded-full border border-regular px-3.5 py-[7px] text-13 font-medium text-sub">
                브랜드
              </button>
            )}
          </div>
          <div className="flex items-center justify-between lg:hidden">
            <p className="text-13 font-medium text-sub-weak tabular-nums">{formatCount(results.length)}개</p>
            <label className="relative flex items-center gap-0.5 text-13 font-medium text-main">
              <span className="sr-only">정렬</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="appearance-none bg-transparent pr-4.5 outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <img src={chevronDownDark} alt="" className="pointer-events-none absolute right-0 size-4" />
            </label>
          </div>

          <div className="flex gap-6">
            {/* ── 필터 (PC) ── */}
            <aside aria-label="필터" className="hidden w-[282px] shrink-0 flex-col lg:flex">
              <div className="flex items-center justify-between pb-4">
                <h2 className="text-18 font-semibold text-main">필터</h2>
                <button type="button" onClick={() => updateFilters(EMPTY_FILTERS)} className="text-13 font-medium text-sub-weak">
                  초기화
                </button>
              </div>
              <FilterPanel base={base} filters={filters} setFilters={updateFilters} />
            </aside>

            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <div className="hidden items-center justify-between gap-4 lg:flex">
                <div className="flex flex-wrap gap-2">
                  {activeChips.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={chip.remove}
                      aria-label={`${chip.label} 조건 빼기`}
                      className="flex items-center gap-1 rounded-full bg-light py-1.5 pr-2 pl-3 text-13 font-medium text-main"
                    >
                      {chip.label}
                      <img src={close14} alt="" className="size-3.5" />
                    </button>
                  ))}
                </div>
                <div className="flex shrink-0 gap-3.5 text-14">
                  {SORTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSort(s)}
                      aria-pressed={s === sort}
                      className={s === sort ? 'font-semibold text-main' : 'text-sub-weak hover:text-main'}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {visible.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-4 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-10">
                  {visible.map((product) => (
                    <ProductCard key={product.id} product={product} showAiBadge wideThumbOnMobile />
                  ))}
                </div>
              ) : (
                // 검색 결과 0건 (상태 시안 438:3117) — 조건이 많으면 AI 검색을 권하고, 결과가 있는 검색어로 다시 시작하게 한다
                <div className="flex flex-col gap-4 lg:mx-auto lg:w-full lg:max-w-120">
                  <StateEmpty
                    icon="search"
                    title={activeChips.length > 0 ? '조건에 맞는 상품이 없어요' : '검색 결과가 없어요'}
                    description={'단어를 줄이거나, 조건을 AI에게\n말로 물어보세요'}
                    action={{ label: 'AI로 찾아보기', onClick: askAi }}
                  >
                    {activeChips.length > 0 && (
                      <button type="button" onClick={() => updateFilters(EMPTY_FILTERS)} className="text-14 font-medium text-sub underline underline-offset-2">
                        필터 모두 풀기
                      </button>
                    )}
                  </StateEmpty>
                  {suggestions.length > 0 && (
                    <div className="flex flex-col gap-2.5 pt-4">
                      <p className="text-14 font-semibold text-main">이런 검색어는 어때요?</p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.map((keyword) => (
                          <a
                            key={keyword}
                            href={`${accioHref('/list')}?q=${encodeURIComponent(keyword)}`}
                            className="rounded-full border border-regular px-3 py-1.5 text-13 font-medium text-sub"
                          >
                            {keyword}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Pagination
                page={current}
                total={totalPages}
                onChange={(p) => {
                  setPage(p)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            </div>
          </div>
        </Container>
      </main>

      <SiteFooter hideOnMobile />
      <MobileTabBar />
      <FloatingStack />

      {/* ── 필터 시트 (모바일) ── */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 lg:hidden" onClick={() => setSheetOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="필터"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85svh] flex-col rounded-t-xl bg-white"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-18 font-semibold text-main">필터</h2>
              <button type="button" onClick={() => updateFilters(EMPTY_FILTERS)} className="text-13 font-medium text-sub-weak">
                초기화
              </button>
            </div>
            <div className="overflow-y-auto px-5">
              <FilterPanel base={base} filters={filters} setFilters={updateFilters} />
            </div>
            <div className="border-t border-light px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
              <Button variant="primary" onClick={() => setSheetOpen(false)} className="w-full">
                {formatCount(results.length)}개 상품 보기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
