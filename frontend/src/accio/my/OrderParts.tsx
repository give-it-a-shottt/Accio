import { useState } from 'react'
import cameraIcon from '../assets/v4/icons/camera.svg'
import chevronRightWeak from '../assets/v4/icons/chevron-right-weak.svg'
import { productHref } from '../data/catalog'
import { accioHref } from '../routes'
import Modal, { RadioRow } from '../ui/Modal'
import { Button } from '../ui/primitives'
import { cartActions, findProduct } from '../ui/useCart'
import { arrivalLabel, formatDate, orderActions, type Order, type OrderStatus } from '../ui/useOrders'
import { formatWon } from '../utils/format'

const STATUS_CLASS: Record<OrderStatus, string> = {
  결제완료: 'bg-regular text-sub',
  배송준비: 'bg-regular text-sub',
  배송중: 'bg-status-success-soft text-status-success',
  배송완료: 'bg-regular text-main',
  취소: 'bg-status-error-soft text-status-error',
  반품: 'bg-status-error-soft text-status-error',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`w-fit rounded-[6px] px-2 py-[3px] text-12 font-semibold ${STATUS_CLASS[status]}`}>{status}</span>
}

/** 주문 카드 안 작은 버튼 — 높이 36 */
function SmallButton({ children, onClick, disabled }: { children: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 min-w-30 items-center justify-center rounded-md border border-regular bg-white px-3.5 text-14 font-semibold text-main disabled:opacity-45"
    >
      {children}
    </button>
  )
}

/** 배송 조회 (Figma 428:1951) — 단계가 아래에서 위로 쌓인다 */
function TrackingModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const d = new Date(order.orderedAt)
  const md = (offsetHours: number) => {
    const t = new Date(d.getTime() + offsetHours * 3600_000)
    return `${String(t.getMonth() + 1).padStart(2, '0')}.${String(t.getDate()).padStart(2, '0')} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
  }
  const steps = [
    { label: '배송 출발', detail: `${md(23.5)} · 인천 계양 대리점`, done: order.status === '배송중' || order.status === '배송완료' },
    { label: '간선 하차', detail: `${md(15)} · 인천 HUB`, done: order.status === '배송중' || order.status === '배송완료' },
    { label: '상품 인수', detail: `${md(7.7)} · 판매자 출고 완료`, done: order.status !== '결제완료' },
    { label: '결제 완료', detail: md(0), done: true },
  ]
  const current = steps.findIndex((s) => s.done)

  return (
    <Modal
      title="배송 조회"
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose} className="w-full">
          확인
        </Button>
      }
    >
      <p className="flex gap-3 rounded-md bg-status-success-soft px-3 py-2.5 text-13">
        <span className="font-semibold text-status-success">{order.status === '배송완료' ? '배송완료' : order.status === '배송중' ? '배송중' : '준비중'}</span>
        <span className="text-sub">{arrivalLabel(d)} 도착 예정 · CJ대한통운 1234-5678-9012</span>
      </p>
      <ol className="relative flex flex-col gap-4 pl-6">
        <span aria-hidden className="absolute top-2 bottom-6 left-[5px] w-0.5 bg-regular" />
        {steps.map((step, i) => (
          <li key={step.label} className="relative flex flex-col">
            <span
              aria-hidden
              className={`absolute top-1 -left-6 rounded-full ${i === current ? 'size-3 bg-black' : 'top-1.5 -left-[22px] size-2 bg-regular'}`}
            />
            <span className={`text-15 ${i === current ? 'font-semibold text-main' : 'text-sub'}`}>{step.label}</span>
            <span className="text-12 text-sub-weak">{step.detail}</span>
          </li>
        ))}
      </ol>
    </Modal>
  )
}

function ProductSummary({ order }: { order: Order }) {
  const line = order.lines[0]
  const product = findProduct(line.productId)
  if (!product) return null
  return (
    <div className="flex items-center gap-3 rounded-md bg-light px-3.5 py-3">
      <img src={product.image} alt="" className="size-13 rounded-sm object-cover" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-14 text-main">
          {product.fullName ?? product.name}
          {order.lines.length > 1 && ` 외 ${order.lines.length - 1}건`}
        </p>
        <p className="text-12 text-sub-weak tabular-nums">
          {line.option} · {line.quantity}개 · {formatWon(line.price * line.quantity)}
        </p>
      </div>
    </div>
  )
}

const CANCEL_REASONS = ['단순 변심', '중복 주문', '상품 정보 오류', '기타']
const RETURN_REASONS = ['상품 불량', '오배송', '설명과 다름', '단순 변심 (왕복 배송비 6,000원)', '기타']

/** 주문 취소 (Figma 428:2037) */
function CancelModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [reason, setReason] = useState(CANCEL_REASONS[0])
  return (
    <Modal
      title="주문 취소"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} className="flex-1">
            닫기
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              orderActions.cancel(order, reason)
              onClose()
            }}
            className="flex-1"
          >
            취소 신청
          </Button>
        </>
      }
    >
      <ProductSummary order={order} />
      <fieldset>
        <legend className="text-15 font-semibold text-main">취소 사유</legend>
        {CANCEL_REASONS.map((r) => (
          <RadioRow key={r} name="cancel-reason" label={r} checked={reason === r} onChange={() => setReason(r)} />
        ))}
      </fieldset>
      <p className="flex justify-between rounded-md bg-light px-3.5 py-3 text-14">
        <span className="text-sub">환불 예정 금액</span>
        <span className="text-16 font-semibold text-main tabular-nums">{formatWon(order.total)}</span>
      </p>
    </Modal>
  )
}

/** 반품 신청 (Figma 428:2109 · MO 428:2153) — 사유 · 내용 · 사진(최대 5장) */
function ReturnModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [reason, setReason] = useState(RETURN_REASONS[0])
  const [detail, setDetail] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  return (
    <Modal
      title="반품 신청"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} className="flex-1">
            닫기
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              orderActions.requestReturn(order, order.lines[0].productId, reason, detail)
              onClose()
            }}
            className="flex-1"
          >
            반품 신청
          </Button>
        </>
      }
    >
      <ProductSummary order={order} />
      <fieldset>
        <legend className="text-15 font-semibold text-main">반품 사유</legend>
        {RETURN_REASONS.map((r) => (
          <RadioRow key={r} name="return-reason" label={r} checked={reason === r} onChange={() => setReason(r)} />
        ))}
      </fieldset>
      <textarea
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="자세한 내용을 적어 주세요 (선택)"
        aria-label="반품 내용"
        className="h-22 resize-none rounded-md border border-regular px-4 py-3.5 text-14 text-main outline-none placeholder:text-disabled focus:border-[1.5px] focus:border-black"
      />
      <PhotoPicker photos={photos} onChange={setPhotos} />
    </Modal>
  )
}

/** 사진 첨부 — 점선 칸을 누르면 고르고, 고른 사진은 옆에 미리 보인다(최대 5장) */
export function PhotoPicker({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {photos.length < 5 && (
        <label className="flex size-18 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[10px] border border-dashed border-regular">
          <img src={cameraIcon} alt="" className="size-6" />
          <span className="text-11 text-sub-weak tabular-nums">{photos.length}/5</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            aria-label="사진 첨부"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []).slice(0, 5 - photos.length)
              onChange([...photos, ...files.map((f) => URL.createObjectURL(f))])
              e.target.value = ''
            }}
          />
        </label>
      )}
      {photos.map((src, i) => (
        <button key={src} type="button" onClick={() => onChange(photos.filter((p) => p !== src))} aria-label={`사진 ${i + 1} 빼기`}>
          <img src={src} alt="" className="size-18 rounded-[10px] object-cover" />
        </button>
      ))}
    </div>
  )
}

/**
 * 주문 카드 — 날짜 · 주문번호 · 상품 줄 · 상태에 맞는 버튼.
 * 결제완료=주문취소, 배송중=배송조회(취소 불가), 배송완료=반품·리뷰·다시 담기, 취소/반품=상세.
 */
export function OrderCard({ order }: { order: Order }) {
  const [modal, setModal] = useState<'track' | 'cancel' | 'return' | null>(null)
  const [open, setOpen] = useState(false)
  const go = (path: string) => {
    window.location.hash = accioHref(path)
  }
  const reorder = () => {
    order.lines.forEach((l) => {
      const product = findProduct(l.productId)
      if (product) cartActions.add(product, l.option, l.quantity)
    })
    go('/cart')
  }

  return (
    <article className="flex flex-col gap-3.5 rounded-lg border border-regular px-4 py-4 lg:px-6 lg:py-5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-16 font-semibold text-main tabular-nums">{formatDate(order.orderedAt)}</span>
          <span className="text-12 text-sub-weak tabular-nums">주문번호 {order.no}</span>
        </p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex shrink-0 items-center text-13 font-medium text-sub-weak"
        >
          상세
          <img src={chevronRightWeak} alt="" className={`size-4 transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>
      </div>
      {open && (
        <dl className="grid grid-cols-[72px_1fr] gap-y-1.5 rounded-md bg-light px-4 py-3 text-13">
          <dt className="text-sub-weak">결제 수단</dt>
          <dd className="text-main">{order.method}</dd>
          <dt className="text-sub-weak">결제 금액</dt>
          <dd className="font-semibold text-main tabular-nums">{formatWon(order.total)}</dd>
          <dt className="text-sub-weak">배송지</dt>
          <dd className="text-main">서울특별시 성동구 왕십리로 83-21</dd>
        </dl>
      )}

      {order.lines.map((line, i) => {
        const product = findProduct(line.productId)
        if (!product) return null
        return (
          <div key={`${line.productId}-${line.option}`} className="flex items-center gap-3.5">
            <a href={productHref(product)} className="shrink-0">
              <img src={product.image} alt="" className="size-18 rounded-[10px] object-cover" />
            </a>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {i === 0 && <StatusBadge status={order.status} />}
              <a href={productHref(product)} className="truncate text-14 text-main">
                {product.fullName ?? product.name}
              </a>
              <p className="text-12 text-sub-weak tabular-nums">
                {line.option} · {line.quantity}개 · {formatWon(line.price * line.quantity)}
              </p>
            </div>
          </div>
        )
      })}

      <div className="flex flex-wrap justify-end gap-2">
        {order.status === '결제완료' && <SmallButton onClick={() => setModal('cancel')}>주문취소</SmallButton>}
        {(order.status === '배송준비' || order.status === '배송중') && (
          <>
            <SmallButton onClick={() => setModal('track')}>배송조회</SmallButton>
            <SmallButton disabled>주문취소 불가</SmallButton>
          </>
        )}
        {order.status === '배송완료' && (
          <>
            <SmallButton onClick={() => setModal('return')}>반품신청</SmallButton>
            <SmallButton onClick={() => go('/mypage/reviews')}>리뷰 쓰기</SmallButton>
            <SmallButton onClick={reorder}>다시 담기</SmallButton>
          </>
        )}
        {(order.status === '취소' || order.status === '반품') && (
          <SmallButton onClick={() => go('/mypage/claims')}>{`${order.status} 상세`}</SmallButton>
        )}
      </div>

      {modal === 'track' && <TrackingModal order={order} onClose={() => setModal(null)} />}
      {modal === 'cancel' && <CancelModal order={order} onClose={() => setModal(null)} />}
      {modal === 'return' && <ReturnModal order={order} onClose={() => setModal(null)} />}
    </article>
  )
}
