import { FOOTER } from '../data/catalog'
import { accioHref } from '../routes'
import { Container, Logo } from './primitives'

/** 푸터 링크 → 화면. 나머지(회사 소개·공지사항·약관 등)는 고객센터로 */
const FOOTER_PATHS: Record<string, string> = {
  베스트: '/list',
  '오늘의 특가': '/list',
  신상품: '/list',
  기획전: '/list',
  숏폼: '/list',
  주문내역: '/mypage/orders',
  '취소·반품': '/mypage/claims',
  찜: '/mypage/wishlist',
  '최근 본 상품': '/mypage/recent',
  '내 리뷰': '/mypage/reviews',
  '판매자 입점': '/seller/join',
  '입점 문의': '/seller/join',
  'AI 검색 안내': '/ai',
}
const footerHref = (label: string) => accioHref(FOOTER_PATHS[label] ?? '/support')

/** 공통 푸터. PC 는 고객센터 + 링크 3열, 모바일은 로고·정책 링크·회사 정보만 회색 바탕에 둔다(목록처럼 시안에 없는 화면은 hideOnMobile) */
export default function SiteFooter({ hideOnMobile = false }: { hideOnMobile?: boolean }) {
  return (
    <footer>
      {/* ── PC ── */}
      <div className="hidden border-t border-regular pt-14 pb-16 lg:block">
        <Container className="flex flex-col gap-10">
          <div className="grid grid-cols-4 gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-15 font-semibold text-main">고객센터</p>
              <p className="text-24 font-semibold text-main tabular-nums">{FOOTER.phone}</p>
              <p className="text-13 text-sub-weak">
                {FOOTER.hours[0]}
                <br />
                {FOOTER.hours[1]}
              </p>
            </div>
            {FOOTER.columns.map((column) => (
              <nav key={column.title} aria-label={column.title} className="flex flex-col gap-2.5">
                <p className="text-15 font-semibold text-main">{column.title}</p>
                {column.links.map((link) => (
                  <a key={link} href={footerHref(link)} className="w-fit text-14 text-sub hover:text-main">
                    {link}
                  </a>
                ))}
              </nav>
            ))}
          </div>

          <div className="h-px bg-light" />

          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-3">
              <Logo height={34.4} />
              <div className="flex gap-5 text-13 text-sub">
                {FOOTER.policies.map((policy) => (
                  <a key={policy} href={footerHref(policy)} className={policy === '개인정보처리방침' ? 'font-semibold' : ''}>
                    {policy}
                  </a>
                ))}
              </div>
              <p className="text-12 text-sub-weak">
                {FOOTER.company}
                <br />
                {FOOTER.address}
              </p>
            </div>
            <p className="text-12 text-sub-weak">© 2026 Accio</p>
          </div>
        </Container>
      </div>

      {/* ── 모바일 (아래 120 은 하단 탭 바 자리) ── */}
      <div className={`flex-col gap-4 bg-light px-5 pt-8 pb-30 lg:hidden ${hideOnMobile ? 'hidden' : 'flex'}`}>
        <Logo height={25.8} />
        <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-12 text-sub">
          {['이용약관', '개인정보처리방침', '고객센터', '입점 문의'].map((policy) => (
            <a key={policy} href={footerHref(policy)} className={policy === '개인정보처리방침' ? 'font-semibold' : ''}>
              {policy}
            </a>
          ))}
        </div>
        <p className="text-11 text-sub-weak">
          고객센터 {FOOTER.phone} · 평일 09:00 – 18:00
          <br />
          (주)액시오 · 대표 홍길동 · 사업자등록번호 000-00-00000
          <br />
          개인 포트폴리오 프로젝트로, 실제 판매가 이루어지지 않습니다.
        </p>
      </div>
    </footer>
  )
}
