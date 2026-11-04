import { useEffect, useState, type FormEvent } from 'react'
import backIcon from '../assets/v4/icons/back.svg'
import cartIcon from '../assets/v4/icons/cart.svg'
import chevronRightWeak from '../assets/v4/icons/chevron-right-weak.svg'
import closeIcon from '../assets/v4/icons/close.svg'
import heartIcon from '../assets/v4/icons/heart.svg'
import menuIcon from '../assets/v4/icons/menu.svg'
import searchSubIcon from '../assets/v4/icons/search-sub.svg'
import searchIcon from '../assets/v4/icons/search.svg'
import userIcon from '../assets/v4/icons/user.svg'
import {
  GNB_LINKS,
  POPULAR_KEYWORDS,
  SEARCH_PLACEHOLDER,
  TOP_BANNER,
  UTILITY_LINKS,
} from '../data/catalog'
import { accioHref } from '../routes'
import { Container, Logo } from './primitives'
import useAuth, { authActions } from './useAuth'
import useCart, { findProduct } from './useCart'

interface SiteHeaderProps {
  /** GNB 에서 밑줄을 그을 메뉴 (상품 상세처럼 해당 없는 화면은 비운다) */
  active?: (typeof GNB_LINKS)[number]['label']
  /** PC 맨 위 '첫 구매 쿠폰' 띠 배너 — 홈에서만 보인다 */
  showBanner?: boolean
  /** 모바일 하위 화면 상단바 제목. 주면 홈형 헤더 대신 '뒤로 · 제목 · 검색 · 장바구니' 바를 쓴다 */
  mobileTitle?: string
}

function goSearch(query: string) {
  const q = query.trim()
  if (q) window.location.hash = `${accioHref('/list')}?q=${encodeURIComponent(q)}`.slice(1)
}

/** 장바구니 아이콘 + 개수 배지 (흰 테두리로 아이콘과 떼어 놓는다) */
function CartWithBadge() {
  // 품절 상품은 살 수 없으니 개수에서 뺀다
  const count = useCart().filter((item) => !findProduct(item.productId)?.soldOut).length
  return (
    <span className="relative size-6">
      <img src={cartIcon} alt="" className="size-6" />
      {count > 0 && (
        <span className="absolute -top-1.5 left-3.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-accio px-1 text-11 font-semibold text-white tabular-nums">
          {count}
        </span>
      )}
    </span>
  )
}

function SearchForm({ variant }: { variant: 'pc' | 'mo' }) {
  const [query, setQuery] = useState('')
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    goSearch(query)
  }

  if (variant === 'mo')
    return (
      <form role="search" onSubmit={onSubmit} className="flex h-11 items-center gap-2 rounded-full bg-light pr-3.5 pl-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={SEARCH_PLACEHOLDER.mo}
          aria-label="상품 검색"
          className="min-w-0 flex-1 bg-transparent text-14 text-main outline-none placeholder:text-disabled"
        />
        <button type="submit" aria-label="검색" className="shrink-0">
          <img src={searchSubIcon} alt="" className="size-6" />
        </button>
      </form>
    )

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full border-[1.5px] border-black bg-white pr-4 pl-6 focus-within:border-accio focus-within:shadow-accio-3"
    >
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={SEARCH_PLACEHOLDER.pc}
        aria-label="상품 검색"
        className="min-w-0 flex-1 bg-transparent text-15 text-main outline-none placeholder:text-disabled"
      />
      <button type="submit" aria-label="검색" className="shrink-0">
        <img src={searchIcon} alt="" className="size-6" />
      </button>
    </form>
  )
}

/** 모바일 하위 화면 상단바 — 뒤로가기 · 제목 · 검색 · 장바구니 */
function MobileTopBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 py-2.5 pr-4 pl-3 lg:hidden">
      <button type="button" onClick={() => window.history.back()} aria-label="뒤로 가기">
        <img src={backIcon} alt="" className="size-6" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-18 font-semibold text-main">{title}</h1>
      <div className="flex items-center gap-4">
        <a href={accioHref('/list')} aria-label="검색">
          <img src={searchIcon} alt="" className="size-6" />
        </a>
        <a href={accioHref('/cart')} aria-label="장바구니">
          <img src={cartIcon} alt="" className="size-6" />
        </a>
      </div>
    </div>
  )
}

/** 모바일 홈 헤더 — 로고+찜·장바구니 · 검색창 · 가로 스크롤 탭 */
function MobileHomeHeader({ active }: { active?: SiteHeaderProps['active'] }) {
  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between py-2 pr-4 pl-5">
        <Logo height={30.96} />
        <div className="flex items-center gap-4">
          <a href={accioHref('/mypage/wishlist')} aria-label="찜">
            <img src={heartIcon} alt="" className="size-6" />
          </a>
          <a href={accioHref('/cart')} aria-label="장바구니">
            <CartWithBadge />
          </a>
        </div>
      </div>
      <div className="px-5 pt-1 pb-2">
        <SearchForm variant="mo" />
      </div>
      <nav aria-label="쇼핑 메뉴" className="flex gap-[22px] overflow-x-auto border-b border-regular px-5 scrollbar-none">
        {GNB_LINKS.map((link) => {
          const isActive = link.label === active
          return (
            <a
              key={link.label}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={`shrink-0 pt-3 text-15 whitespace-nowrap ${isActive ? 'border-b-2 border-black pb-2 font-semibold text-main' : 'pb-2.5 font-medium text-sub'}`}
            >
              {link.label}
            </a>
          )
        })}
      </nav>
    </div>
  )
}

/** 인기 검색어 — 3초마다 다음 순위로 넘어간다 */
function PopularKeyword() {
  const [rank, setRank] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setRank((r) => (r + 1) % POPULAR_KEYWORDS.length), 3000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <button type="button" onClick={() => goSearch(POPULAR_KEYWORDS[rank])} className="flex items-center gap-2">
      <span className="text-12 text-sub-weak">인기 검색어</span>
      <span className="text-13 font-semibold text-main tabular-nums">{rank + 1}</span>
      <span className="text-13 font-medium text-main">{POPULAR_KEYWORDS[rank]}</span>
      <img src={chevronRightWeak} alt="" className="size-4" />
    </button>
  )
}

/**
 * 공통 헤더. PC(lg~): 상단 띠 배너 · 유틸 링크 · 로고+통합 검색+액션 · GNB.
 * 모바일: 홈은 로고+찜·장바구니 · 검색창 · 가로 스크롤 탭, 하위 화면은 MobileTopBar. (하단 탭 바는 MobileTabBar)
 */
export default function SiteHeader({ active, showBanner = false, mobileTitle }: SiteHeaderProps) {
  const [bannerOpen, setBannerOpen] = useState(showBanner)
  const user = useAuth()
  // 로그인하면 '로그인·회원가입' 자리에 이름과 로그아웃이 온다
  const utilityLinks: { label: string; href?: string; onClick?: () => void }[] = user
    ? [{ label: `${user.name}님`, href: accioHref('/mypage') }, { label: '로그아웃', onClick: authActions.logout }, ...UTILITY_LINKS.slice(2)]
    : UTILITY_LINKS

  return (
    <header className="bg-white">
      {/* ── PC ── */}
      <div className="hidden lg:block">
        {bannerOpen && (
          <div className="bg-light">
            <Container className="flex items-center justify-between py-2.5">
              <span className="size-4" aria-hidden />
              <a href={TOP_BANNER.href} className="flex items-center gap-2 text-13">
                <span className="text-sub">{TOP_BANNER.lead}</span>
                <span className="font-semibold text-main">{TOP_BANNER.highlight}</span>
                <img src={chevronRightWeak} alt="" className="size-4" />
              </a>
              <button type="button" onClick={() => setBannerOpen(false)} aria-label="배너 닫기">
                <img src={closeIcon} alt="" className="size-4" />
              </button>
            </Container>
          </div>
        )}

        <Container className="flex items-center justify-end gap-4 pt-2.5">
          {utilityLinks.map((link, i) => (
            <span key={link.label} className="flex items-center gap-4">
              {i > 0 && <span aria-hidden className="h-2.5 w-px bg-regular" />}
              {link.onClick ? (
                <button type="button" onClick={link.onClick} className="text-12 text-sub-weak hover:text-main">
                  {link.label}
                </button>
              ) : (
                <a href={link.href} className="text-12 text-sub-weak hover:text-main">
                  {link.label}
                </a>
              )}
            </span>
          ))}
        </Container>

        <Container className="flex items-center gap-10 pt-3.5 pb-[18px]">
          <Logo height={46.44} />
          <SearchForm variant="pc" />
          <nav aria-label="내 메뉴" className="flex items-end gap-5">
            <a href={accioHref('/mypage/wishlist')} className="flex min-w-11 flex-col items-center gap-1 text-12 text-sub">
              <img src={heartIcon} alt="" className="size-6" />찜
            </a>
            <a href={accioHref('/cart')} className="flex min-w-11 flex-col items-center gap-1 text-12 text-sub">
              <CartWithBadge />
              장바구니
            </a>
            <a href={accioHref('/mypage')} className="flex min-w-11 flex-col items-center gap-1 text-12 text-sub">
              <img src={userIcon} alt="" className="size-6" />
              마이
            </a>
          </nav>
        </Container>

        <div className="border-b border-regular">
          <Container className="flex items-center justify-between">
            <nav aria-label="쇼핑 메뉴" className="flex items-center gap-7">
              <a href={accioHref('/list')} className="flex items-center gap-1.5 py-3.5 text-15 font-semibold text-main">
                <img src={menuIcon} alt="" className="size-6" />
                카테고리
              </a>
              {GNB_LINKS.map((link) => {
                const isActive = link.label === active
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`pt-3.5 text-15 ${isActive ? 'border-b-2 border-black pb-3 font-semibold text-main' : 'pb-3.5 font-medium text-sub hover:text-main'}`}
                  >
                    {link.label}
                  </a>
                )
              })}
            </nav>
            <PopularKeyword />
          </Container>
        </div>
      </div>

      {/* ── 모바일 ── */}
      {mobileTitle !== undefined ? <MobileTopBar title={mobileTitle} /> : <MobileHomeHeader active={active} />}
    </header>
  )
}
