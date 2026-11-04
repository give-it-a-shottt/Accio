import type { ReactNode } from 'react'
import { accioHref } from '../routes'
import MobileTabBar from '../ui/MobileTabBar'
import { Container } from '../ui/primitives'
import SiteFooter from '../ui/SiteFooter'
import SiteHeader from '../ui/SiteHeader'
import { authActions } from '../ui/useAuth'
import { MY_MENU } from './menu'

/**
 * 내 정보 화면 틀 — PC 는 왼쪽 마이페이지 메뉴(180) + 본문, 모바일은 상단바 제목 + 본문.
 * (Figma 마이페이지 427:1663 · 주문내역 427:1989 등이 같은 틀을 쓴다)
 */
export default function MyLayout({ path, title, aside, children }: { path: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-svh bg-white">
      <SiteHeader mobileTitle={title} />
      <main>
        <Container className="flex gap-12 pt-5 pb-30 lg:pt-12">
          <nav aria-label="마이페이지 메뉴" className="hidden w-45 shrink-0 flex-col gap-7 lg:flex">
            <a href={accioHref('/mypage')} className="text-24 font-semibold text-main">
              마이페이지
            </a>
            {MY_MENU.map((group) => (
              <div key={group.group} className="flex flex-col gap-3">
                <p className="text-12 font-semibold text-sub-weak">{group.group}</p>
                {group.items.map((item) => (
                  <a
                    key={item.path}
                    href={accioHref(item.path)}
                    aria-current={item.path === path ? 'page' : undefined}
                    className={`text-15 ${item.path === path ? 'font-semibold text-main' : 'text-sub hover:text-main'}`}
                  >
                    {item.label}
                  </a>
                ))}
                {group.group === '기타' && (
                  <button type="button" onClick={authActions.logout} className="w-fit text-15 text-sub hover:text-main">
                    로그아웃
                  </button>
                )}
              </div>
            ))}
          </nav>
          <div className="flex min-w-0 flex-1 flex-col gap-5 lg:gap-6">
            {path !== '/mypage' && (
              <div className="flex items-center justify-between gap-3">
                <h1 className="hidden text-24 font-semibold text-main lg:block">{title}</h1>
                <div className="ml-auto">{aside}</div>
              </div>
            )}
            {children}
          </div>
        </Container>
      </main>
      <SiteFooter hideOnMobile />
      <MobileTabBar active={path === '/mypage/wishlist' ? '찜' : '마이'} />
    </div>
  )
}
