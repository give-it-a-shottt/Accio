import cardHeartOn from '../assets/v4/icons/card-heart-on.svg'
import cardHeart from '../assets/v4/icons/card-heart.svg'
import heart20On from '../assets/v4/icons/heart-20-on.svg'
import heart20 from '../assets/v4/icons/heart-20.svg'
import { productHref, type Product } from '../data/catalog'
import { formatCount, formatWon } from '../utils/format'
import { AiDot } from './primitives'
import useWishlist from './useWishlist'

interface ProductCardProps {
  product: Product
  /** 'AI 추천' 배지를 붙인다 (AI 개인 추천 영역) */
  showAiBadge?: boolean
  /** 모바일 목록(2열 169)처럼 썸네일을 정사각형 대신 높이 140 으로 낮출 때 */
  wideThumbOnMobile?: boolean
  className?: string
}

/**
 * 디자인 시스템 Product Card — 썸네일 radius 12, 할인율은 accio-strong.
 * 모바일(Mini Card)은 글자가 한 단계 작고(13·15·11) 썸네일과 글 사이가 8, PC 는 14·16·12 에 12.
 */
export default function ProductCard({ product, showAiBadge = false, wideThumbOnMobile = false, className = '' }: ProductCardProps) {
  const wishlist = useWishlist()
  const liked = wishlist.has(product.id)

  return (
    <article className={`relative flex flex-col gap-2 lg:gap-3 ${className}`}>
      <div className="relative overflow-hidden rounded-md bg-light">
        <img
          src={product.image}
          alt=""
          className={`block aspect-square w-full object-cover ${wideThumbOnMobile ? 'max-lg:aspect-auto max-lg:h-35' : ''}`}
          loading="lazy"
        />
        <button
          type="button"
          onClick={() => wishlist.toggle(product.id)}
          aria-pressed={liked}
          aria-label={liked ? '찜 해제' : '찜하기'}
          className="absolute right-2 bottom-2 z-10 flex size-5 items-center justify-center transition-transform active:scale-90 lg:right-[18px] lg:bottom-[18px] lg:size-[18px]"
        >
          {/* 찜하면 빨간 하트(status/error #E5484D)로 채운다 */}
          <img src={liked ? heart20On : heart20} alt="" className="size-5 lg:hidden" />
          <img src={liked ? cardHeartOn : cardHeart} alt="" className="hidden h-[19.76px] w-[19.6px] max-w-none lg:block" />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {showAiBadge && product.aiPick && (
          <span className="flex w-fit items-center gap-[3px] rounded-xs bg-accio-soft px-1.5 py-0.5 text-11 font-semibold text-accio-strong lg:gap-1 lg:px-2 lg:py-[3px]">
            <AiDot size={7} />
            AI 추천
          </span>
        )}
        <p className="truncate text-12 font-medium text-sub-weak">{product.brand}</p>
        <h3 className="line-clamp-2 text-13 text-main lg:text-14">
          {/* 카드 전체를 덮는 링크 — 찜 버튼은 z-10 으로 위에 둔다 */}
          <a href={productHref(product)} className="after:absolute after:inset-0">
            {product.name}
          </a>
        </h3>
        <p className="flex gap-1 text-15 font-semibold whitespace-nowrap tabular-nums lg:gap-1.5 lg:text-16">
          {product.discountRate > 0 && <span className="text-accio-strong">{product.discountRate}%</span>}
          <span className="text-main">{formatWon(product.price)}</span>
        </p>
        <p className="text-11 text-sub-weak tabular-nums lg:text-12">
          {product.reviewCount > 0 ? `★ ${product.rating.toFixed(1)} (${formatCount(product.reviewCount)})` : '새 상품 · 리뷰 없음'}
        </p>
      </div>
    </article>
  )
}
