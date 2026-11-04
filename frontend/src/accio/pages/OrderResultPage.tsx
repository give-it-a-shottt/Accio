import { useCallback, useEffect, useState, type ReactNode } from 'react'
import resultFail from '../assets/v4/icons/result-fail.svg'
import resultSuccess from '../assets/v4/icons/result-success.svg'
import { accioHref } from '../routes'
import { Button } from '../ui/primitives'
import SiteFooter from '../ui/SiteFooter'
import SiteHeader from '../ui/SiteHeader'
import { Spinner } from '../ui/states'
import useCart, { findProduct } from '../ui/useCart'
import useOrders, { arrivalLabel, PAYMENT_ERRORS, placeOrder } from '../ui/useOrders'
import { formatWon } from '../utils/format'
import { OrderSteps } from './CartPage'

const go = (path: string) => {
  window.location.hash = accioHref(path)
}

/** 결과 화면 틀 — 단계 표시 · 큰 아이콘 · 제목 · 안내 · 카드 · 버튼 두 개(모바일은 아래 고정) */
function ResultLayout({
  step,
  icon,
  title,
  description,
  mobileDescription,
  mobileTitle,
  children,
  actions,
}: {
  step: 2 | 3
  icon: string
  title: string
  description: string
  mobileDescription: string
  mobileTitle: string
  children: ReactNode
  actions: ReactNode
}) {
  return (
    <div className="min-h-svh bg-white">
      <SiteHeader mobileTitle={mobileTitle} />
      <main className="flex flex-col items-center gap-4 px-5 pt-14 pb-40 lg:pt-24">
        <div className="hidden lg:block">
          <OrderSteps current={step} />
        </div>
        <img src={icon} alt="" className="size-18 lg:mt-6" />
        <h1 className="text-24 font-semibold text-main lg:text-28">{title}</h1>
        <p className="text-center text-14 text-sub lg:text-15">
          <span className="lg:hidden">{mobileDescription}</span>
          <span className="hidden lg:inline">{description}</span>
        </p>
        <div className="mt-4 w-full lg:w-120">{children}</div>
        <div className="fixed inset-x-0 bottom-0 flex gap-2 bg-white px-5 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] lg:static lg:p-0 lg:pt-4">
          {actions}
        </div>
      </main>
      <SiteFooter hideOnMobile />
    </div>
  )
}

// 이번 방문에서 승인 확인을 마친 주문 — 같은 주문을 다시 열면 확인 화면 없이 바로 결과를 보여 준다
const confirmedOrders = new Set<string>()
const CONFIRM_STEPS = ['결제 정보 받음', '금액 확인 중', '주문 확정']

/**
 * 결제 승인 확인 중 (상태 시안 439:3304) — 결제창에서 돌아온 뒤 서버가 금액이 맞는지 보는 동안.
 * 목업이라 단계마다 0.6초씩 넘어가고, 승인은 장바구니에서 이미 한 번만 일어났다.
 */
function PaymentConfirming({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const timer = window.setTimeout(() => (step < CONFIRM_STEPS.length - 1 ? setStep(step + 1) : onDone()), 600)
    return () => window.clearTimeout(timer)
  }, [step, onDone])

  return (
    <main aria-busy="true" className="flex min-h-svh flex-col items-center justify-center gap-3.5 bg-white px-5">
      <Spinner size={40} />
      <h1 className="text-20 font-semibold text-main">결제를 확인하고 있어요</h1>
      <p className="text-14 text-sub-weak">창을 닫거나 뒤로 가지 마세요</p>
      <ol className="flex w-[300px] flex-col gap-2 rounded-[14px] bg-light px-5 py-4">
        {CONFIRM_STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? 'step' : undefined} className={`flex items-center gap-2 text-14 ${i <= step ? 'font-medium text-main' : 'text-sub-weak'}`}>
            <span aria-hidden className={`size-2 rounded-full ${i <= step ? 'bg-main' : 'bg-icon-disabled/40'}`} />
            {label}
          </li>
        ))}
      </ol>
    </main>
  )
}

/** 결제 성공 (Figma PC 424:1339 · MO 424:1489) — 막 결제한 주문은 승인 확인 화면을 먼저 거친다 */
export function OrderCompletePage({ orderNo }: { orderNo?: string }) {
  const orders = useOrders()
  const order = orders.find((o) => o.no === orderNo) ?? orders[0]
  const [confirming, setConfirming] = useState(() => !!orderNo && !confirmedOrders.has(orderNo))
  const finishConfirm = useCallback(() => {
    if (orderNo) confirmedOrders.add(orderNo)
    setConfirming(false)
  }, [orderNo])

  if (confirming) return <PaymentConfirming onDone={finishConfirm} />

  if (!order)
    return (
      <ResultLayout
        step={3}
        icon={resultSuccess}
        title="아직 주문한 상품이 없어요"
        description="장바구니에서 상품을 골라 주문해 보세요."
        mobileDescription="장바구니에서 상품을 골라 주문해 보세요"
        mobileTitle="주문 완료"
        actions={
          <Button variant="primary" onClick={() => go('/cart')} className="flex-1 lg:w-59 lg:flex-none">
            장바구니로
          </Button>
        }
      >
        {null}
      </ResultLayout>
    )

  const first = findProduct(order.lines[0].productId)
  const rest = order.lines.length - 1
  const summary: [string, string][] = [
    ['주문번호', order.no],
    ['주문 상품', `${first?.name ?? '상품'}${rest > 0 ? ` 외 ${rest}건` : ''}`],
    ['결제 수단', order.method],
    ['결제 금액', formatWon(order.total)],
  ]

  return (
    <ResultLayout
      step={3}
      icon={resultSuccess}
      title="주문이 완료됐어요"
      description={`${arrivalLabel(new Date(order.orderedAt))}까지 도착할 예정이에요. 주문내역에서 배송 상황을 볼 수 있어요.`}
      mobileDescription={`${arrivalLabel(new Date(order.orderedAt))}까지 도착할 예정이에요`}
      mobileTitle="주문 완료"
      actions={
        <>
          <Button onClick={() => go('/mypage')} className="flex-1 lg:w-59 lg:flex-none">
            <span className="lg:hidden">주문내역</span>
            <span className="hidden lg:inline">주문내역 보기</span>
          </Button>
          <Button variant="primary" onClick={() => go('')} className="flex-1 lg:w-59 lg:flex-none">
            쇼핑 계속하기
          </Button>
        </>
      }
    >
      <section aria-label="주문 요약" className="flex flex-col gap-3 rounded-lg bg-light px-6 py-5">
        <dl className="flex flex-col gap-3 text-14">
          {summary.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-sub">{label}</dt>
              <dd className="text-right font-medium text-main tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex gap-2 pt-1">
          {order.lines.map((line) => {
            const product = findProduct(line.productId)
            return product ? <img key={`${line.productId}-${line.option}`} src={product.image} alt={product.name} className="size-14 rounded-sm object-cover" /> : null
          })}
        </div>
      </section>
    </ResultLayout>
  )
}

/** 결제 실패 (Figma PC 424:1537 · MO 424:1674) */
export function OrderFailPage({ code = 'REJECT_CARD_PAYMENT' }: { code?: string }) {
  const items = useCart()
  const error = PAYMENT_ERRORS[code] ?? { reason: '알 수 없는 오류', short: '알 수 없는 오류' }

  // 다시 결제 — 테스트 한도를 넘는 금액이면 같은 실패로 돌아온다
  const retry = () => {
    const result = placeOrder(items)
    go(result.ok ? `/order/complete?no=${result.no}` : result.code === 'EMPTY' ? '/cart' : `/order/fail?code=${result.code}`)
  }

  return (
    <ResultLayout
      step={2}
      icon={resultFail}
      title="결제를 완료하지 못했어요"
      description="카드사 승인이 거절됐어요. 결제는 진행되지 않았으니 안심하세요."
      mobileDescription="결제는 진행되지 않았어요"
      mobileTitle="결제 실패"
      actions={
        <>
          <Button onClick={() => go('/cart')} className="flex-1 lg:w-59 lg:flex-none">
            장바구니로
          </Button>
          <Button variant="primary" onClick={retry} className="flex-1 lg:w-59 lg:flex-none">
            다시 결제하기
          </Button>
        </>
      }
    >
      <section aria-label="실패 사유" className="flex flex-col gap-1.5 rounded-lg bg-light px-5 py-4 lg:px-6">
        <p className="text-12 font-semibold text-sub-weak">실패 사유</p>
        <p className="text-15 font-medium text-main">
          <span className="lg:hidden">{error.short}</span>
          <span className="hidden lg:inline">
            {error.reason} ({code})
          </span>
        </p>
      </section>
    </ResultLayout>
  )
}
