import close20 from '../assets/v4/icons/close-20.svg'
import chevronRightWeak from '../assets/v4/icons/chevron-right-weak.svg'
import { listPriceOf, productHref, type Product } from '../data/catalog'
import { accioHref } from '../routes'
import { Button, CheckMark, Container, Stepper } from '../ui/primitives'
import SiteFooter from '../ui/SiteFooter'
import SiteHeader from '../ui/SiteHeader'
import { DemoAccountHint, StateEmpty } from '../ui/states'
import useAuth from '../ui/useAuth'
import useCart, { cartActions, findProduct, summarize } from '../ui/useCart'
import { useRecentViews } from '../ui/useMyData'
import { placeOrder } from '../ui/useOrders'
import { formatWon } from '../utils/format'

/** 장바구니 → 주문/결제 → 주문 완료 단계 표시 */
export function OrderSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="hidden items-center gap-2 text-14 lg:flex">
      {['장바구니', '주문/결제', '주문 완료'].map((step, i) => (
        <li key={step} className="flex items-center gap-2">
          {i > 0 && <img src={chevronRightWeak} alt="" className="size-4" />}
          <span className={i + 1 === current ? 'font-semibold text-main' : 'text-disabled'} aria-current={i + 1 === current ? 'step' : undefined}>
            {i + 1} {step}
          </span>
        </li>
      ))}
    </ol>
  )
}

/** 결제 금액 줄 — 상품 금액 · 할인 · 배송비 */
export function PriceRows({ listTotal, discount, fee }: { listTotal: number; discount: number; fee: number }) {
  return (
    <dl className="flex flex-col gap-3 text-14 lg:gap-3.5">
      <div className="flex justify-between">
        <dt className="text-sub">상품 금액</dt>
        <dd className="font-medium text-main tabular-nums">{formatWon(listTotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-sub">할인 금액</dt>
        <dd className="font-medium text-accio-strong tabular-nums">{discount > 0 ? `-${formatWon(discount)}` : '0원'}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-sub">배송비</dt>
        <dd className="font-medium text-main tabular-nums">{fee === 0 ? '무료' : formatWon(fee)}</dd>
      </div>
    </dl>
  )
}

/**
 * 장바구니 (Figma PC 424:971 · MO 424:1212).
 * 선택한 상품만 결제 금액에 들어가고, 품절 상품은 선택할 수 없다. 수량·삭제는 바로 저장된다.
 */
export default function CartPage() {
  const user = useAuth()
  const recentProducts = useRecentViews()
    .map((v) => findProduct(v.productId))
    .filter((p): p is Product => !!p)
    .slice(0, 5)
  const items = useCart()
  const { lines, payable, listTotal, discount, fee, total } = summarize(items)
  const selectable = lines.filter(({ product }) => !product.soldOut)
  const allChecked = selectable.length > 0 && selectable.every(({ item }) => item.checked)
  const checkedKeys = lines.filter(({ item }) => item.checked).map(({ item }) => item.key)
  // 목업 결제(토스페이 테스트) — 성공하면 주문 완료, 테스트 한도를 넘으면 결제 실패 화면으로
  const goCheckout = () => {
    const result = placeOrder(items)
    if (result.ok) window.location.hash = accioHref(`/order/complete?no=${result.no}`)
    else if (result.code !== 'EMPTY') window.location.hash = accioHref(`/order/fail?code=${result.code}`)
  }

  return (
    <div className="min-h-svh bg-white lg:bg-light">
      <div className="bg-white">
        <SiteHeader mobileTitle="장바구니" />
      </div>

      <main className="pb-40 lg:pb-30">
        <Container className="flex flex-col gap-2 pt-4 lg:gap-8 lg:pt-10">
          <div className="hidden items-center justify-between lg:flex">
            <h1 className="text-28 font-semibold text-main">장바구니</h1>
            <OrderSteps current={1} />
          </div>

          {!user ? (
            // 비로그인 (상태 시안 439:3253) — 로그인하면 장바구니로 돌아온다
            <div className="flex flex-col items-center gap-4 bg-white py-16 lg:rounded-xl lg:py-20">
              <StateEmpty
                icon="lock"
                title="로그인이 필요해요"
                description={'로그인하면 담아 둔 상품을\n어느 기기에서나 볼 수 있어요'}
                action={{ label: '로그인하기', href: `${accioHref('/login')}?next=${encodeURIComponent('/cart')}` }}
              />
              <p className="flex gap-1.5 text-14">
                <span className="text-sub">처음이신가요?</span>
                <a href={accioHref('/signup')} className="font-semibold text-main">
                  회원가입
                </a>
              </p>
              <DemoAccountHint />
            </div>
          ) : lines.length === 0 ? (
            // 빈 장바구니 (상태 시안 439:3210) — 쇼핑으로 돌려보내고, 최근 본 상품은 바로 담을 수 있게
            <div className="flex flex-col gap-6 bg-white py-10 lg:rounded-xl lg:px-10 lg:py-16">
              <StateEmpty icon="box" title="장바구니가 비었어요" description="마음에 드는 상품을 담아 보세요" action={{ label: '쇼핑하러 가기', href: accioHref('/list') }} />
              {recentProducts.length > 0 && (
                <section aria-label="최근 본 상품" className="flex flex-col gap-3 pt-6 lg:mx-auto lg:w-full lg:max-w-[720px]">
                  <h2 className="text-15 font-semibold text-main">최근 본 상품</h2>
                  <ul className="-mx-5 flex gap-2.5 overflow-x-auto px-5 scrollbar-none lg:mx-0 lg:grid lg:grid-cols-5 lg:px-0">
                    {recentProducts.map((product) => (
                      <li key={product.id} className="relative flex w-27.5 shrink-0 flex-col gap-1.5 lg:w-auto">
                        <a href={productHref(product)} className="block">
                          <img src={product.image} alt={product.name} className="aspect-square w-full rounded-[10px] object-cover" />
                        </a>
                        <p className="text-13 font-semibold text-main tabular-nums">{formatWon(product.price)}</p>
                        {!product.soldOut && (
                          <button
                            type="button"
                            onClick={() => cartActions.add(product, '기본', 1)}
                            className="w-fit text-12 font-medium text-sub underline underline-offset-2"
                          >
                            담기
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              {/* 상품 목록 */}
              <section aria-label="담은 상품" className="flex min-w-0 flex-1 flex-col bg-white lg:rounded-xl lg:px-7 lg:pt-5 lg:pb-2">
                <div className="flex items-center justify-between pb-2 lg:pb-4">
                  <label className="flex cursor-pointer items-center gap-2 text-14 font-medium text-main">
                    <input type="checkbox" checked={allChecked} onChange={() => cartActions.toggleAll(!allChecked)} className="sr-only" />
                    <CheckMark checked={allChecked} />
                    전체 선택 ({checkedKeys.length}/{lines.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => cartActions.remove(checkedKeys)}
                    disabled={checkedKeys.length === 0}
                    className="text-13 text-sub-weak disabled:opacity-40"
                  >
                    선택 삭제
                  </button>
                </div>

                <ul>
                  {lines.map(({ item, product }) => {
                    const soldOut = !!product.soldOut
                    const price = product.price * item.quantity
                    return (
                      <li key={item.key} className="flex items-start gap-3 border-t border-light py-5 lg:gap-4">
                        <label className={soldOut ? 'cursor-not-allowed' : 'cursor-pointer'}>
                          <input
                            type="checkbox"
                            checked={item.checked && !soldOut}
                            disabled={soldOut}
                            onChange={() => cartActions.toggle(item.key)}
                            aria-label={`${product.name} 선택`}
                            className="sr-only"
                          />
                          <CheckMark checked={item.checked && !soldOut} />
                        </label>
                        <a href={productHref(product)} className="shrink-0">
                          <img
                            src={product.image}
                            alt=""
                            className={`size-20 rounded-[10px] object-cover lg:size-24 ${soldOut ? 'opacity-50' : ''}`}
                          />
                        </a>

                        <div className="flex min-w-0 flex-1 flex-col gap-1 lg:flex-row lg:items-start lg:gap-10">
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            {soldOut && <span className="w-fit rounded-xs bg-regular px-1.5 py-0.5 text-11 font-semibold text-sub">품절</span>}
                            <p className="text-12 font-medium text-sub-weak">{product.brand}</p>
                            <a href={productHref(product)} className={`text-15 ${soldOut ? 'text-disabled' : 'text-main'}`}>
                              {product.fullName ?? product.name}
                            </a>
                            <p className="text-12 text-sub-weak">옵션: {item.option}</p>
                          </div>
                          <div className="flex items-center justify-between pt-1.5 lg:gap-10 lg:pt-0">
                            <Stepper value={item.quantity} onChange={(n) => cartActions.setQuantity(item.key, n)} compact label={`${product.name} 수량`} />
                            <div className="flex flex-col items-end gap-0.5 lg:w-25">
                              {!soldOut && product.discountRate > 0 && (
                                <p className="hidden text-12 text-disabled line-through tabular-nums lg:block">{formatWon(listPriceOf(product) * item.quantity)}</p>
                              )}
                              <p className={`text-15 font-semibold tabular-nums lg:text-16 ${soldOut ? 'text-disabled' : 'text-main'}`}>{formatWon(price)}</p>
                            </div>
                          </div>
                        </div>

                        <button type="button" onClick={() => cartActions.remove([item.key])} aria-label={`${product.name} 삭제`} className="shrink-0">
                          <img src={close20} alt="" className="size-5" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>

              <div aria-hidden className="h-2 bg-regular lg:hidden" />

              {/* 결제 예정 금액 — PC 는 오른쪽에 붙어 따라온다 */}
              <aside aria-label="결제 예정 금액" className="flex flex-col gap-3.5 bg-white lg:sticky lg:top-6 lg:w-96 lg:rounded-xl lg:p-6">
                <h2 className="hidden text-18 font-semibold text-main lg:block">결제 예정 금액</h2>
                <PriceRows listTotal={listTotal} discount={discount} fee={fee} />
                <div className="hidden h-px bg-light lg:block" />
                <div className="hidden items-center justify-between font-semibold text-main lg:flex">
                  <span className="text-15">총 결제 금액</span>
                  <span className="text-24 tabular-nums">{formatWon(total)}</span>
                </div>
                <Button variant="primary" disabled={payable.length === 0} onClick={goCheckout} className="hidden h-14 w-full lg:flex">
                  {payable.length === 0 ? '주문할 상품을 골라 주세요' : `${formatWon(total)} 주문하기`}
                </Button>
                <p className="hidden text-12 text-sub-weak lg:block">금액은 결제 직전에 서버에서 다시 계산돼요.</p>
              </aside>
            </div>
          )}
        </Container>
      </main>

      <div className="bg-white">
        <SiteFooter hideOnMobile />
      </div>

      {/* 모바일 고정 주문 바 */}
      {user && lines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-light bg-white pt-3 pr-4 pb-[calc(12px+env(safe-area-inset-bottom))] pl-5 lg:hidden">
          <div className="flex flex-col">
            <span className="text-12 text-sub-weak">총 결제 금액</span>
            <span className="text-20 font-semibold text-main tabular-nums">{formatWon(total)}</span>
          </div>
          <Button variant="primary" disabled={payable.length === 0} onClick={goCheckout} className="h-13 flex-1">
            주문하기
          </Button>
        </div>
      )}
    </div>
  )
}
