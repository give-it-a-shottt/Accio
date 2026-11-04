import type { ReactNode } from 'react'
import { accioHref } from '../routes'
import { Logo } from '../ui/primitives'
import SiteFooter from '../ui/SiteFooter'
import SiteHeader from '../ui/SiteHeader'
import { DemoAccountHint, StateEmpty } from '../ui/states'
import useAuth from '../ui/useAuth'
import { DEMO_SELLER_EMAIL, useSellerClaims, useSellerOrders, useSellerProducts, useSellerProfile } from './sellerData'

/**
 * 판매자센터 틀 (Figma 431:3006 등) — 왼쪽 메뉴 240(로고 · 스토어 · 메뉴 · 쇼핑몰로), 오른쪽 회색 본문.
 * 판매자 화면은 PC 전용 시안이라, 좁은 화면에서는 메뉴를 위쪽 가로 탭으로 접는다.
 */
export default function SellerLayout({ path, title, actions, children }: { path: string; title: string; actions?: ReactNode; children: ReactNode }) {
  const profile = useSellerProfile()
  const user = useAuth()
  const products = useSellerProducts()
  const orders = useSellerOrders()
  const claims = useSellerClaims()

  // 판매자가 아닌 회원 (상태 시안 439:3494) — 판매자 등록을 안내한다. 로그인 전에는 예시 스토어를 그대로 보여 준다
  const isSeller = !!profile && (!user || (profile.email ?? DEMO_SELLER_EMAIL) === user.email)
  if (!isSeller)
    return (
      <div className="flex min-h-svh flex-col bg-white">
        <SiteHeader mobileTitle="판매자센터" />
        <main className="flex flex-1 items-center justify-center px-5 py-20 lg:py-40">
          <StateEmpty
            icon="lock"
            title="판매자 등록이 필요해요"
            description={'사업자 정보만 있으면 5분이면 끝나요.\n등록하면 AI가 상품 등록을 도와드려요'}
            action={{ label: '판매자 등록하기', href: accioHref('/seller/join') }}
          >
            {/* 지금 계정은 판매자가 아니라서, 예시 스토어(캠프로 스토어)를 보려면 예시 계정으로 바꿔 들어오게 안내한다 */}
            <div className="flex flex-col items-center gap-1 pt-4">
              <p className="text-13 text-sub">예시 스토어는 예시 계정으로 로그인하면 볼 수 있어요</p>
              <DemoAccountHint />
            </div>
          </StateEmpty>
        </main>
        <SiteFooter hideOnMobile />
      </div>
    )
  const menu = [
    { label: '대시보드', path: '/seller' },
    { label: '상품 관리', path: '/seller/products', count: products.length },
    { label: '상품 등록', path: '/seller/products/new' },
    { label: '주문 관리', path: '/seller/orders', count: orders.filter((o) => o.status === '결제완료' || o.status === '배송준비').length },
    { label: '클레임 관리', path: '/seller/claims', count: claims.filter((c) => !c.result).length },
  ]

  return (
    <div className="flex min-h-svh flex-col bg-light lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 border-b border-regular bg-white px-5 py-4 lg:sticky lg:top-0 lg:h-svh lg:w-60 lg:gap-6 lg:border-r lg:border-b-0 lg:py-6">
        <div className="flex items-center gap-2">
          <Logo height={27.52} />
          <span className="rounded-xs bg-regular px-1.5 py-0.5 text-11 font-semibold text-sub">판매자센터</span>
        </div>
        {profile && (
          <div className="hidden flex-col gap-0.5 rounded-md bg-light p-3 lg:flex">
            <p className="text-14 font-semibold text-main">{profile.storeName}</p>
            <p className="text-12 text-sub-weak tabular-nums">사업자 {profile.bizNo}</p>
          </div>
        )}
        <nav aria-label="판매자 메뉴" className="-mx-5 flex gap-0.5 overflow-x-auto px-5 scrollbar-none lg:mx-0 lg:flex-col lg:px-0">
          {menu.map((item) => {
            const active = item.path === path
            return (
              <a
                key={item.path}
                href={accioHref(item.path)}
                aria-current={active ? 'page' : undefined}
                className={`flex shrink-0 items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-14 whitespace-nowrap ${active ? 'bg-regular font-semibold text-main' : 'text-sub hover:bg-light'}`}
              >
                {item.label}
                {item.count !== undefined && <span className="text-12 font-medium text-sub-weak tabular-nums">{item.count}</span>}
              </a>
            )
          })}
          <span className="shrink-0 px-3 py-2.5 text-14 whitespace-nowrap text-disabled">정산 (준비 중)</span>
        </nav>
        <a href={accioHref()} className="mt-auto hidden text-13 font-medium text-sub-weak lg:block">
          ← 쇼핑몰로 돌아가기
        </a>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-6 px-5 pt-6 pb-12 lg:px-10 lg:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-24 font-semibold text-main">{title}</h1>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  )
}

/** 판매자센터 작은 버튼(높이 36) — 주 행동은 오렌지 */
export function SellerButton({ children, primary = false, onClick, href, disabled }: { children: ReactNode; primary?: boolean; onClick?: () => void; href?: string; disabled?: boolean }) {
  const className = `flex h-9 min-w-30 items-center justify-center rounded-md px-3.5 text-15 font-semibold whitespace-nowrap disabled:opacity-40 ${
    primary ? 'bg-accio text-white active:bg-accio-strong' : 'border border-regular bg-white text-main'
  }`
  return href ? (
    <a href={href} className={className}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  )
}
