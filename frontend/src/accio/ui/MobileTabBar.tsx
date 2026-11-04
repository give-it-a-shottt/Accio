import tabCategory from '../assets/v4/icons/tab-category.svg'
import tabHeart from '../assets/v4/icons/tab-heart.svg'
import tabHome from '../assets/v4/icons/tab-home.svg'
import tabUser from '../assets/v4/icons/tab-user.svg'
import { accioHref } from '../routes'
import { AiDot } from './primitives'

type Tab = '홈' | '카테고리' | 'AI 검색' | '찜' | '마이'

const TABS: { label: Exclude<Tab, 'AI 검색'>; icon: string; href: string }[] = [
  { label: '홈', icon: tabHome, href: accioHref() },
  { label: '카테고리', icon: tabCategory, href: accioHref('/list') },
  { label: '찜', icon: tabHeart, href: accioHref('/mypage/wishlist') },
  { label: '마이', icon: tabUser, href: accioHref('/mypage') },
]

/** 모바일 하단 탭 바 — 가운데 AI 검색은 항상 브랜드색(오렌지 말풍선 점)으로 둔다 */
export default function MobileTabBar({ active = '홈' }: { active?: Tab }) {
  const item = (tab: (typeof TABS)[number]) => {
    const isActive = tab.label === active
    return (
      <a
        key={tab.label}
        href={tab.href}
        aria-current={isActive ? 'page' : undefined}
        className={`flex w-16 flex-col items-center gap-[3px] text-11 ${isActive ? 'font-semibold text-main' : 'text-sub-weak'}`}
      >
        <img src={tab.icon} alt="" className="size-6" />
        {tab.label}
      </a>
    )
  }

  return (
    <nav
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-between border-t border-light bg-white px-2 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] lg:hidden"
    >
      {TABS.slice(0, 2).map(item)}
      <a
        href={accioHref('/ai')}
        aria-current={active === 'AI 검색' ? 'page' : undefined}
        className="flex w-16 flex-col items-center gap-[3px] text-11 font-semibold text-accio-strong"
      >
        <span className="flex h-6 w-11 items-center justify-center rounded-full bg-accio-soft">
          <AiDot size={12} />
        </span>
        AI 검색
      </a>
      {TABS.slice(2).map(item)}
    </nav>
  )
}
