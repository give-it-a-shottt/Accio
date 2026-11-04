import FloatingStack from '../ui/FloatingStack'
import MobileTabBar from '../ui/MobileTabBar'
import SiteFooter from '../ui/SiteFooter'
import SiteHeader from '../ui/SiteHeader'
import AiHero from './AiHero'
import AiRecommend from './AiRecommend'
import { QuickCategory, TodaysDiscovery } from './Discovery'
import EditorPick from './EditorPick'
import EventCarousel from './EventCarousel'
import FeaturedBrand from './FeaturedBrand'
import Shortform from './Shortform'
import TimeDeal from './TimeDeal'

/**
 * 쇼핑몰 홈 (Figma ACCIO · Home / PC 1440 v2, Home / MO 390).
 * 오늘의 발견·에디터 픽은 PC 만, 빠른 카테고리·하단 탭 바는 모바일만 있다.
 */
export default function HomePage() {
  return (
    <div className="min-h-svh bg-white">
      <SiteHeader active="홈" showBanner />
      <main>
        <AiHero />
        <EventCarousel />
        <QuickCategory />
        <TodaysDiscovery />
        <TimeDeal />
        <Shortform />
        <FeaturedBrand />
        <EditorPick />

        {/* 큐레이션 영역과 개인 추천 사이를 굵은 회색 띠로 끊는다 */}
        <div aria-hidden className="mt-12 h-2 bg-regular lg:mt-24 lg:h-3" />
        <AiRecommend />
      </main>
      <div className="mt-12 lg:mt-30">
        <SiteFooter />
      </div>
      <FloatingStack />
      <MobileTabBar active="홈" />
    </div>
  )
}
