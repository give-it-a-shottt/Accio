import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import chevronDownDark from '../assets/v4/icons/chevron-down-dark.svg'
import searchSub from '../assets/v4/icons/search-sub.svg'
import uploadIcon from '../assets/v4/icons/upload.svg'
import { accioHref } from '../routes'
import { AiDot, CheckMark } from '../ui/primitives'
import { Skeleton, Spinner } from '../ui/states'
import { formatCount, formatWon } from '../utils/format'
import SellerLayout, { SellerButton } from './SellerLayout'
import {
  AI_INSIGHTS,
  productStatus,
  sellerActions,
  sellerImage,
  useSellerClaims,
  useSellerOrders,
  useSellerProducts,
  useSellerProfile,
  WEEKLY_SALES,
  type SellerOrderStatus,
  type SellerProductStatus,
} from './sellerData'

const go = (path: string) => {
  window.location.hash = accioHref(path)
}

const STATUS_CHIP: Record<SellerProductStatus | SellerOrderStatus | '의심 주문' | '접수', string> = {
  판매중: 'bg-status-success-soft text-status-success',
  품절: 'bg-regular text-sub',
  숨김: 'bg-regular text-sub-weak',
  결제완료: 'bg-regular text-sub',
  배송준비: 'bg-regular text-main',
  배송중: 'bg-status-success-soft text-status-success',
  배송완료: 'bg-regular text-sub',
  '의심 주문': 'bg-status-error-soft text-status-error',
  접수: 'bg-regular text-main',
}

function Chip({ label }: { label: keyof typeof STATUS_CHIP }) {
  return <span className={`w-fit rounded-[6px] px-2 py-[3px] text-12 font-semibold whitespace-nowrap ${STATUS_CHIP[label]}`}>{label}</span>
}

/** 흰 카드 — radius 16 */
function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg bg-white px-6 py-5 ${className}`}>{children}</section>
}

/** 대시보드 (Figma 431:3006) — 오늘 숫자 · AI 인사이트 · 7일 매출 · 처리할 일 */
export function SellerDashboard() {
  const profile = useSellerProfile()
  const orders = useSellerOrders()
  const claims = useSellerClaims()
  const ready = orders.filter((o) => o.status === '배송준비')
  const suspicious = orders.filter((o) => o.suspicious)
  const openClaims = claims.filter((c) => !c.result)
  const max = Math.max(...WEEKLY_SALES.map((d) => d.amount))
  const stats = [
    { label: '오늘 주문', value: '12건', note: '어제보다 +3' },
    { label: '오늘 매출', value: formatWon(WEEKLY_SALES[6].amount), note: '어제보다 +18%' },
    { label: '배송 준비', value: `${ready.length}건`, note: '오늘 출고 마감 16:00' },
    { label: '처리할 클레임', value: `${openClaims.length}건`, note: openClaims.some((c) => c.priority === '높음') ? '1건 우선 처리 권장' : '급한 건 없어요' },
  ]
  const todos = [
    { label: `배송 준비 ${ready.length}건 출고하기`, chip: '배송준비' as const, path: '/seller/orders' },
    ...(suspicious.length ? [{ label: `의심 주문 ${suspicious.length}건 확인`, chip: '의심 주문' as const, path: '/seller/orders' }] : []),
    { label: `반품 접수 ${openClaims.length}건 검토`, chip: '접수' as const, path: '/seller/claims' },
  ]

  return (
    <SellerLayout
      path="/seller"
      title={`안녕하세요, ${profile?.storeName ?? '판매자'}님`}
      actions={
        <>
          <SellerButton href={accioHref('/list')}>스토어 보기</SellerButton>
          <SellerButton primary href={accioHref('/seller/products/new')}>
            + 상품 등록
          </SellerButton>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex flex-col gap-1">
            <p className="text-14 text-sub">{s.label}</p>
            <p className="text-24 font-semibold text-main tabular-nums lg:text-28">{s.value}</p>
            <p className="text-12 text-sub-weak">{s.note}</p>
          </Card>
        ))}
      </div>

      <section aria-label="AI 인사이트" className="flex flex-col gap-3 rounded-lg border border-black bg-white px-6 py-5">
        <p className="flex items-center gap-1.5">
          <AiDot size={12} />
          <span className="text-16 font-semibold text-main">AI 인사이트</span>
          <span className="text-12 text-sub-weak">매일 오전 9시 업데이트</span>
        </p>
        {AI_INSIGHTS.map((line) => (
          <p key={line} className="rounded-md bg-light px-4 py-3 text-14 text-main">
            {line}
          </p>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        <Card className="flex flex-col gap-4">
          <h2 className="text-16 font-semibold text-main">최근 7일 매출</h2>
          <div className="flex h-44 items-end gap-1" role="img" aria-label={`최근 7일 매출, 오늘 ${formatWon(WEEKLY_SALES[6].amount)}`}>
            {WEEKLY_SALES.map((d, i) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2" title={`${d.day} ${formatWon(d.amount)}`}>
                <span className={`w-full max-w-10 ${i === WEEKLY_SALES.length - 1 ? 'bg-black' : 'bg-icon-disabled'}`} style={{ height: `${(d.amount / max) * 140}px` }} />
                <span className="text-12 text-sub-weak">{d.day}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col">
          <h2 className="pb-2 text-16 font-semibold text-main">처리할 일</h2>
          {todos.map((t) => (
            <button key={t.label} type="button" onClick={() => go(t.path)} className="flex items-center justify-between gap-3 border-b border-light py-4 text-left text-14 text-main">
              {t.label}
              <Chip label={t.chip} />
            </button>
          ))}
        </Card>
      </div>
    </SellerLayout>
  )
}

const PRODUCT_PAGE = 6

/** 상품 관리 (Figma 431:3117) — 검색·분류·상태로 거르고, 고른 상품을 지우거나 엑셀(CSV)로 내보낸다 */
export function SellerProducts() {
  const products = useSellerProducts()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('전체')
  const [status, setStatus] = useState<'전체' | SellerProductStatus>('전체')
  const [picked, setPicked] = useState<number[]>([])
  const [page, setPage] = useState(1)

  const categories = ['전체', ...new Set(products.map((p) => p.category))]
  const filtered = products.filter(
    (p) =>
      (!query.trim() || p.name.includes(query.trim()) || String(p.no).includes(query.trim())) &&
      (category === '전체' || p.category === category) &&
      (status === '전체' || productStatus(p) === status),
  )
  const pages = Math.max(1, Math.ceil(filtered.length / PRODUCT_PAGE))
  const current = Math.min(page, pages)
  const visible = filtered.slice((current - 1) * PRODUCT_PAGE, current * PRODUCT_PAGE)
  const allPicked = visible.length > 0 && visible.every((p) => picked.includes(p.no))

  // 엑셀에서 바로 열리는 CSV(한글이 깨지지 않게 BOM 포함)
  const exportCsv = () => {
    const rows = [['상품번호', '상품명', '카테고리', '판매가', '재고', '상태'], ...filtered.map((p) => [p.no, p.name, p.category, p.price, p.stock, productStatus(p)])]
    const csv = '﻿' + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = '캠프로_상품목록.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const select = (label: string, value: string, options: string[], onChange: (v: string) => void) => (
    <label className="relative flex h-10 items-center rounded-[10px] border border-regular pr-8 pl-3.5 text-14 text-main">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none bg-transparent outline-none">
        {options.map((o) => (
          <option key={o} value={o}>
            {label} {o}
          </option>
        ))}
      </select>
      <img src={chevronDownDark} alt="" className="pointer-events-none absolute right-2.5 size-4" />
    </label>
  )

  return (
    <SellerLayout
      path="/seller/products"
      title="상품 관리"
      actions={
        <>
          <SellerButton onClick={exportCsv}>엑셀 내보내기</SellerButton>
          <SellerButton primary href={accioHref('/seller/products/new')}>
            + 상품 등록
          </SellerButton>
        </>
      }
    >
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-regular px-3.5 lg:max-w-90">
            <img src={searchSub} alt="" className="size-5" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="상품명·상품번호 검색"
              aria-label="상품 검색"
              className="min-w-0 flex-1 bg-transparent text-14 text-main outline-none placeholder:text-disabled"
            />
          </label>
          {select('카테고리', category, categories, (v) => {
            setCategory(v)
            setPage(1)
          })}
          {select('상태', status, ['전체', '판매중', '품절', '숨김'], (v) => {
            setStatus(v as typeof status)
            setPage(1)
          })}
          <p className="ml-auto text-13 text-sub-weak tabular-nums">총 {formatCount(filtered.length)}개</p>
        </div>

        {picked.length > 0 && (
          <div className="flex items-center gap-3 rounded-md bg-light px-4 py-2.5 text-14">
            <span className="text-main">{picked.length}개 선택</span>
            <button
              type="button"
              onClick={() => {
                sellerActions.removeProducts(picked)
                setPicked([])
              }}
              className="font-semibold text-status-error"
            >
              선택 삭제
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-14">
            <thead>
              <tr className="bg-light text-12 font-medium text-sub">
                <th className="w-12 rounded-l-md px-4 py-3">
                  <label className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allPicked}
                      onChange={() => setPicked(allPicked ? picked.filter((no) => !visible.some((p) => p.no === no)) : [...new Set([...picked, ...visible.map((p) => p.no)])])}
                      className="sr-only"
                      aria-label="이 페이지 모두 고르기"
                    />
                    <CheckMark checked={allPicked} />
                  </label>
                </th>
                <th className="py-3 font-medium">상품</th>
                <th className="py-3 font-medium">카테고리</th>
                <th className="py-3 font-medium">판매가</th>
                <th className="py-3 font-medium">재고</th>
                <th className="py-3 font-medium">상태</th>
                <th className="rounded-r-md py-3 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const checked = picked.includes(p.no)
                return (
                  <tr key={p.no} className="border-b border-light">
                    <td className="px-4 py-3">
                      <label className="cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setPicked(checked ? picked.filter((no) => no !== p.no) : [...picked, p.no])}
                          className="sr-only"
                          aria-label={`${p.name} 고르기`}
                        />
                        <CheckMark checked={checked} />
                      </label>
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-3">
                        <img src={sellerImage(p.image)} alt="" className="size-11 rounded-sm object-cover" />
                        <span className="flex flex-col">
                          <span className="font-medium text-main">{p.name}</span>
                          <span className="text-12 text-sub-weak tabular-nums">No. {p.no}</span>
                        </span>
                      </span>
                    </td>
                    <td className="py-3 text-main">{p.category}</td>
                    <td className="py-3 text-main tabular-nums">{formatWon(p.price)}</td>
                    <td className={`py-3 tabular-nums ${p.stock === 0 ? 'text-status-error' : 'text-main'}`}>{formatCount(p.stock)}</td>
                    <td className="py-3">
                      <Chip label={productStatus(p)} />
                    </td>
                    <td className="py-3">
                      <span className="flex gap-3 text-13 text-sub">
                        <button type="button" onClick={() => sellerActions.toggleHidden(p.no)}>
                          {p.hidden ? '보이기' : '숨기기'}
                        </button>
                        <button type="button" onClick={() => sellerActions.removeProducts([p.no])}>
                          삭제
                        </button>
                      </span>
                    </td>
                  </tr>
                )
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-14 text-sub">
                    조건에 맞는 상품이 없어요
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <nav aria-label="페이지" className="flex justify-center gap-1.5">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                aria-current={n === current ? 'page' : undefined}
                className={`flex size-9 items-center justify-center rounded-sm text-14 tabular-nums ${n === current ? 'bg-main font-semibold text-white' : 'text-sub hover:bg-light'}`}
              >
                {n}
              </button>
            ))}
          </nav>
        )}
      </Card>
    </SellerLayout>
  )
}

/** 'AI가 채움' 배지 — 손으로 고치면 사라진다 */
function AiFilled() {
  return (
    <span className="flex items-center gap-[3px] rounded-xs bg-accio-soft px-1.5 py-0.5 text-11 font-semibold text-accio-strong">
      <AiDot size={8} />
      AI가 채움
    </span>
  )
}

// 사진을 보고 AI 가 채운 값(목업)
const AI_DRAFT = {
  name: '릴렉스 캠핑 체어 하이백 경량 접이식',
  category: '캠핑 > 캠핑 의자',
  brand: '캠프로',
  price: '52800',
  description: '등받이가 높아 오래 앉아도 편한 하이백 캠핑 체어예요. 알루미늄 프레임으로 2.1kg 가볍고, 30초면 펴고 접을 수 있어요. 수납 가방 포함.',
  colors: ['샌드', '올리브', '차콜'],
  sizes: ['기본', '와이드'],
}
type DraftField = keyof typeof AI_DRAFT
/** AI 가 채우는 순서 — 화면 위에서 아래로 */
const FILL_ORDER: DraftField[] = ['name', 'category', 'brand', 'price', 'description', 'colors', 'sizes']
const EMPTY_DRAFT = { name: '', category: '', brand: '', price: '', description: '', colors: [] as string[], sizes: [] as string[] }

function TagInput({ values, onChange, label }: { values: string[]; onChange: (v: string[]) => void; label: string }) {
  const [adding, setAdding] = useState(false)
  const [text, setText] = useState('')
  const add = (e: FormEvent) => {
    e.preventDefault()
    const v = text.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setText('')
    setAdding(false)
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <span key={v} className="flex items-center gap-1.5 rounded-full bg-light py-[7px] pr-2.5 pl-3 text-13 font-medium text-main">
          {v}
          <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`${label} ${v} 빼기`} className="font-normal text-sub-weak">
            ×
          </button>
        </span>
      ))}
      {adding ? (
        <form onSubmit={add}>
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={add}
            aria-label={`${label} 추가`}
            className="h-[34px] w-24 rounded-full border border-black px-3 text-13 outline-none"
          />
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="rounded-full border border-dashed border-regular px-3 py-[7px] text-13 font-medium text-sub">
          + 추가
        </button>
      )}
    </div>
  )
}

/** 상품 등록 (Figma 433:2988) — 사진을 보고 AI 가 7개 항목을 미리 채우고, 판매자는 확인·수정만 한다. 재고는 직접 넣는다 */
export function SellerProductNew() {
  const [form, setForm] = useState({ ...AI_DRAFT, stock: '', shipping: '스토어 기본 (5만원 이상 무료)' })
  const [aiFields, setAiFields] = useState<DraftField[]>(Object.keys(AI_DRAFT) as DraftField[])
  const [images, setImages] = useState<string[]>(['table', 'lamp', 'bedding', 'chair'])
  const [cover, setCover] = useState(0)
  const [saved, setSaved] = useState('')
  const [touched, setTouched] = useState(false)
  // AI 자동 채움 중 (상태 시안 439:3448) — 채운 항목 수. null 이면 다 채웠다
  const [filling, setFilling] = useState<number | null>(null)

  useEffect(() => {
    if (filling === null) return
    const timer = window.setTimeout(() => {
      if (filling >= FILL_ORDER.length) return setFilling(null)
      const key = FILL_ORDER[filling]
      setForm((f) => ({ ...f, [key]: AI_DRAFT[key] }))
      setAiFields((list) => [...list, key])
      setFilling(filling + 1)
    }, 450)
    return () => window.clearTimeout(timer)
  }, [filling])

  const edit = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setAiFields((list) => list.filter((k) => k !== key))
  }
  // 사진이 바뀌면 AI 가 처음부터 다시 본다 — 항목마다 스켈레톤이었다가 채워진 순서대로 나타난다
  const refill = () => {
    setForm((f) => ({ ...f, ...EMPTY_DRAFT }))
    setAiFields([])
    setFilling(0)
  }
  const pending = filling === null ? [] : FILL_ORDER.slice(filling)
  const stockError = touched && !/^\d+$/.test(form.stock) ? '재고 수량을 숫자로 입력해 주세요' : undefined
  const submit = () => {
    if (filling !== null) return
    setTouched(true)
    if (!/^\d+$/.test(form.stock) || !form.name.trim()) return
    sellerActions.addProduct({
      name: form.name.trim(),
      category: form.category.split('>').pop()?.trim() || '기타',
      price: Number(form.price.replace(/\D/g, '')) || 0,
      stock: Number(form.stock),
      image: images[cover],
    })
    go('/seller/products')
  }

  const field = (key: DraftField, label: string, input: ReactNode, helper?: string) => (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-center gap-1.5 text-14 font-medium text-main">
        {label}
        {aiFields.includes(key) && <AiFilled />}
      </p>
      {pending.includes(key) ? <Skeleton className={`w-full rounded-md ${key === 'description' ? 'h-20' : key === 'colors' || key === 'sizes' ? 'h-[34px] max-w-60 rounded-full' : 'h-12'}`} /> : input}
      {helper && !pending.includes(key) && <p className="text-12 text-sub-weak">{helper}</p>}
    </div>
  )
  const inputClass = 'h-12 w-full rounded-md border border-regular px-4 text-15 text-main outline-none focus:border-[1.5px] focus:border-black'

  return (
    <SellerLayout
      path="/seller/products/new"
      title="상품 등록"
      actions={
        <>
          <SellerButton
            onClick={() => {
              setSaved('임시 저장했어요')
              window.setTimeout(() => setSaved(''), 2000)
            }}
          >
            {saved || '임시 저장'}
          </SellerButton>
          <SellerButton primary onClick={submit} disabled={filling !== null}>
            등록하기
          </SellerButton>
        </>
      }
    >
      {filling !== null ? (
        <p role="status" className="flex items-center gap-2.5 rounded-md bg-accio-soft px-5 py-3.5 text-14 font-medium text-main">
          <Spinner size={14} />
          사진을 보고 채우는 중 · {filling}/{FILL_ORDER.length}
        </p>
      ) : (
        <p className="flex items-center gap-2.5 rounded-md bg-accio-soft px-5 py-3.5 text-14 font-medium text-main">
          <AiDot size={14} />
          <span className="flex-1">사진을 보고 AI가 {aiFields.length}개 항목을 채웠어요. 틀린 곳이 없는지 확인해 주세요.</span>
          <button type="button" onClick={refill} className="font-semibold text-accio-strong">
            다시 채우기
          </button>
        </p>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Card className="flex flex-col gap-3 lg:w-95">
          <h2 className="text-16 font-semibold text-main">상품 이미지</h2>
          <div className="relative overflow-hidden rounded-md">
            <img src={sellerImage(images[cover])} alt="대표 이미지" className="aspect-square w-full object-cover" />
            <span className="absolute top-3 left-3 rounded-[6px] bg-black px-2 py-[3px] text-11 font-semibold text-white">대표</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) =>
              i === cover ? null : (
                <button key={`${img}-${i}`} type="button" onClick={() => setCover(i)} aria-label={`사진 ${i + 1}을 대표로`}>
                  <img src={sellerImage(img)} alt="" className="size-19 rounded-[10px] object-cover" />
                </button>
              ),
            )}
            <label className="flex size-19 cursor-pointer items-center justify-center rounded-[10px] border border-dashed border-regular">
              <img src={uploadIcon} alt="" className="size-8" />
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="sr-only"
                aria-label="사진 올리기"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setImages((list) => [...list, URL.createObjectURL(file)])
                    setCover(images.length)
                    refill()
                  }
                  e.target.value = ''
                }}
              />
            </label>
          </div>
          <p className="text-12 text-sub-weak">jpg·png, 최대 10MB · 사진을 누르면 대표 이미지가 돼요</p>
        </Card>

        <Card className="flex min-w-0 flex-1 flex-col gap-[18px]">
          <h2 className="text-16 font-semibold text-main">기본 정보</h2>
          {field('name', '상품명', <input value={form.name} onChange={(e) => edit('name', e.target.value)} aria-label="상품명" className={inputClass} />)}
          <div className="grid gap-3 lg:grid-cols-2">
            {field('category', '카테고리', <input value={form.category} onChange={(e) => edit('category', e.target.value)} aria-label="카테고리" className={inputClass} />)}
            {field('brand', '브랜드', <input value={form.brand} onChange={(e) => edit('brand', e.target.value)} aria-label="브랜드" className={inputClass} />)}
          </div>
          {field(
            'price',
            '판매가',
            <input
              value={form.price ? `${Number(form.price.replace(/\D/g, '')).toLocaleString('ko-KR')}원` : ''}
              onChange={(e) => edit('price', e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              aria-label="판매가"
              className={inputClass}
            />,
            'AI 추천가: 비슷한 상품 34개 평균 54,200원 · 최저 39,900원',
          )}
          {field(
            'description',
            '상품 설명',
            <textarea
              value={form.description}
              onChange={(e) => edit('description', e.target.value)}
              aria-label="상품 설명"
              className="h-20 w-full resize-none rounded-md border border-regular px-4 py-3 text-15 text-main outline-none focus:border-[1.5px] focus:border-black"
            />,
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            {field('colors', '색상', <TagInput label="색상" values={form.colors} onChange={(v) => edit('colors', v)} />)}
            {field('sizes', '사이즈', <TagInput label="사이즈" values={form.sizes} onChange={(v) => edit('sizes', v)} />)}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="seller-stock" className="text-14 font-medium text-main">
                재고
              </label>
              <input
                id="seller-stock"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value.replace(/\D/g, '') }))}
                inputMode="numeric"
                placeholder="재고 수량을 입력해 주세요"
                aria-invalid={!!stockError}
                className={`h-12 w-full rounded-md px-4 text-15 text-main outline-none placeholder:text-disabled ${stockError ? 'border-[1.5px] border-status-error' : 'border-[1.5px] border-black'}`}
              />
              <p className={`text-12 ${stockError ? 'text-status-error' : 'text-sub-weak'}`}>{stockError ?? '재고는 AI가 채우지 않아요'}</p>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-14 font-medium text-main">배송비</span>
              <span className="relative flex h-10 items-center rounded-[10px] border border-regular pr-8 pl-3.5">
                <select value={form.shipping} onChange={(e) => setForm((f) => ({ ...f, shipping: e.target.value }))} className="w-full appearance-none bg-transparent text-14 text-main outline-none">
                  {['스토어 기본 (5만원 이상 무료)', '무료배송', '3,000원'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <img src={chevronDownDark} alt="" className="pointer-events-none absolute right-2.5 size-4" />
              </span>
            </label>
          </div>
        </Card>
      </div>
    </SellerLayout>
  )
}

const ORDER_TABS = ['전체', '결제완료', '배송준비', '배송중', '배송완료', '의심 주문'] as const
type OrderTab = (typeof ORDER_TABS)[number]

/** 주문 관리 (Figma 433:3141) — 상태 탭, 줄마다 상태 바꾸기, 고른 주문 송장 등록·출고, 의심 주문 확인 */
export function SellerOrders() {
  const orders = useSellerOrders()
  const [tab, setTab] = useState<OrderTab>('배송준비')
  const [picked, setPicked] = useState<string[]>([])
  const count = (t: OrderTab) => (t === '전체' ? orders.length : t === '의심 주문' ? orders.filter((o) => o.suspicious).length : orders.filter((o) => o.status === t).length)
  const visible = orders.filter((o) => (tab === '전체' ? true : tab === '의심 주문' ? !!o.suspicious : o.status === tab))
  const shippable = picked.filter((no) => !orders.find((o) => o.no === no)?.suspicious)
  const allPicked = visible.length > 0 && visible.every((o) => picked.includes(o.no))
  const flagged = visible.find((o) => o.suspicious)

  return (
    <SellerLayout
      path="/seller/orders"
      title="주문 관리"
      actions={
        <>
          <SellerButton disabled={picked.length === 0} onClick={() => sellerActions.registerInvoices(picked)}>
            송장 일괄 등록
          </SellerButton>
          <SellerButton
            primary
            disabled={shippable.length === 0}
            onClick={() => {
              sellerActions.registerInvoices(shippable)
              sellerActions.setOrderStatus(shippable, '배송중')
              setPicked([])
            }}
          >
            선택 출고 처리
          </SellerButton>
        </>
      }
    >
      <Card className="flex flex-col gap-4">
        <div role="tablist" className="-mx-6 flex overflow-x-auto border-b border-regular px-6 scrollbar-none">
          {ORDER_TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={t === tab}
              onClick={() => {
                setTab(t)
                setPicked([])
              }}
              className={`flex flex-1 shrink-0 items-center justify-center gap-1.5 px-3 pt-3 text-14 whitespace-nowrap ${
                t === tab ? 'border-b-2 border-black pb-2.5 font-semibold text-main' : `pb-3 ${t === '의심 주문' ? 'text-status-error' : 'text-sub-weak'}`
              }`}
            >
              {t}
              <span className="text-12 tabular-nums">{count(t)}</span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-14">
            <thead>
              <tr className="bg-light text-12 font-medium text-sub">
                <th className="w-12 rounded-l-md px-4 py-3">
                  <label className="cursor-pointer">
                    <input type="checkbox" checked={allPicked} onChange={() => setPicked(allPicked ? [] : visible.map((o) => o.no))} className="sr-only" aria-label="모두 고르기" />
                    <CheckMark checked={allPicked} />
                  </label>
                </th>
                <th className="py-3 font-medium">주문번호</th>
                <th className="py-3 font-medium">상품</th>
                <th className="py-3 font-medium">구매자</th>
                <th className="py-3 font-medium">결제금액</th>
                <th className="py-3 font-medium">상태</th>
                <th className="rounded-r-md py-3 font-medium">송장</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => {
                const checked = picked.includes(o.no)
                return (
                  <tr key={o.no} className={`border-b border-light ${o.suspicious ? 'bg-status-error-soft' : ''}`}>
                    <td className="px-4 py-3">
                      <label className="cursor-pointer">
                        <input type="checkbox" checked={checked} onChange={() => setPicked(checked ? picked.filter((n) => n !== o.no) : [...picked, o.no])} className="sr-only" aria-label={`${o.no} 고르기`} />
                        <CheckMark checked={checked} />
                      </label>
                    </td>
                    <td className="py-3 text-sub tabular-nums">{o.no}</td>
                    <td className="py-3 text-main">
                      {o.item}
                      {o.suspicious && <span className="ml-3 text-12 font-medium text-status-error">의심 주문</span>}
                    </td>
                    <td className="py-3 text-main">{o.buyer}</td>
                    <td className="py-3 text-main tabular-nums">{formatWon(o.amount)}</td>
                    <td className="py-3">
                      <label className="relative flex h-9 w-30 items-center rounded-[10px] border border-regular bg-white pr-8 pl-3">
                        <span className="sr-only">{o.no} 상태</span>
                        <select
                          value={o.status}
                          onChange={(e) => sellerActions.setOrderStatus([o.no], e.target.value as SellerOrderStatus)}
                          className="w-full appearance-none bg-transparent text-14 text-main outline-none"
                        >
                          {(['결제완료', '배송준비', '배송중', '배송완료'] as const).map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        <img src={chevronDownDark} alt="" className="pointer-events-none absolute right-2.5 size-4" />
                      </label>
                    </td>
                    <td className="py-3 text-13">
                      {o.suspicious ? (
                        <button type="button" onClick={() => sellerActions.resolveSuspicious(o.no)} className="font-medium text-status-error underline-offset-2 hover:underline">
                          확인 필요
                        </button>
                      ) : o.invoice ? (
                        <span className="text-main tabular-nums">{o.invoice}</span>
                      ) : (
                        <span className="text-disabled">미등록</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-14 text-sub">
                    이 상태의 주문이 없어요
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {flagged && (
          <p className="flex items-center gap-2 rounded-md bg-light px-4 py-3 text-13 text-main">
            <AiDot size={12} />
            의심 주문: {flagged.suspicious}. 출고 전에 구매자 확인을 권해요. (‘확인 필요’를 누르면 확인 완료로 바뀌어요)
          </p>
        )}
      </Card>
    </SellerLayout>
  )
}

/** 클레임 관리 (Figma 433:3316) — 왼쪽 목록, 오른쪽 구매자 사유·사진과 AI 분석, 거절·교환 제안·승인 */
export function SellerClaims() {
  const claims = useSellerClaims()
  const [selectedId, setSelectedId] = useState(claims[0]?.id)
  const claim = claims.find((c) => c.id === selectedId) ?? claims[0]

  return (
    <SellerLayout path="/seller/claims" title="클레임 관리">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <section aria-label="클레임 목록" className="flex flex-col gap-1 rounded-lg bg-white p-3 lg:w-95">
          {claims.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              aria-current={c.id === claim?.id ? 'true' : undefined}
              className={`flex flex-col gap-1.5 rounded-md px-3.5 py-3.5 text-left ${c.id === claim?.id ? 'border-[1.5px] border-black' : 'border-[1.5px] border-transparent hover:bg-light'}`}
            >
              <span className="flex items-center gap-1.5 text-12">
                <span className="rounded-[6px] bg-regular px-2 py-0.5 font-semibold text-sub">{c.type}</span>
                <span className={`rounded-[6px] px-2 py-0.5 font-semibold ${c.priority === '높음' ? 'bg-status-error-soft text-status-error' : 'bg-regular text-sub'}`}>{c.priority}</span>
                <span className="text-sub-weak tabular-nums">{c.date} 접수</span>
                {c.result && <span className="ml-auto font-semibold text-status-success">{c.result}</span>}
              </span>
              <span className="text-15 font-medium text-main">{c.product}</span>
              <span className="text-12 text-sub-weak">{c.reason}</span>
            </button>
          ))}
        </section>

        {claim && (
          <Card className="flex min-w-0 flex-1 flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-12 text-sub-weak tabular-nums">
                  {claim.type} 요청 · 주문 {claim.orderNo}
                </p>
                <h2 className="text-20 font-semibold text-main">{claim.product}</h2>
              </div>
              <p className="text-16 font-semibold text-main tabular-nums">환불 예정 {formatWon(claim.refund)}</p>
            </div>

            <div className="flex flex-col gap-3 rounded-md bg-light px-4 py-4">
              <p className="text-12 text-sub-weak">구매자 사유</p>
              <p className="text-15 text-main">“{claim.quote}”</p>
              {claim.photos > 0 && (
                <div className="flex gap-2">
                  {Array.from({ length: claim.photos }, (_, i) => (
                    <img key={i} src={sellerImage(claim.product.includes('테이블') ? 'table' : claim.product.includes('랜턴') ? 'lantern' : 'chair')} alt={`구매자 사진 ${i + 1}`} className="size-20 rounded-sm object-cover" />
                  ))}
                </div>
              )}
            </div>

            <section aria-label="AI 분석" className="flex flex-col gap-3 rounded-lg border border-regular px-5 py-5">
              <p className="flex items-center gap-1.5">
                <AiDot size={12} />
                <span className="text-16 font-semibold text-main">AI 분석</span>
                <span className="text-12 text-sub-weak">사진 {claim.photos}장 · 사유 · 주문 이력 기준</span>
              </p>
              <dl className="grid gap-3 lg:grid-cols-3">
                {(
                  [
                    ['귀책', claim.analysis.fault, false],
                    ['구매자 감정', claim.analysis.mood, claim.priority === '높음'],
                    ['우선순위', claim.analysis.urgency, claim.priority === '높음'],
                  ] as const
                ).map(([label, value, alert]) => (
                  <div key={label} className="flex flex-col gap-1 rounded-md bg-light px-4 py-3">
                    <dt className="text-12 text-sub-weak">{label}</dt>
                    <dd className={`text-14 font-semibold ${alert ? 'text-status-error' : 'text-main'}`}>{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-col gap-1 rounded-md bg-accio-soft px-4 py-3">
                <p className="text-12 font-semibold text-accio-strong">추천 조치</p>
                <p className="text-14 text-main">{claim.analysis.action}</p>
              </div>
            </section>

            {claim.result ? (
              <p className="rounded-md bg-status-success-soft px-4 py-3 text-14 font-medium text-status-success">‘{claim.result}’로 처리했어요. 구매자에게 알림을 보냈어요.</p>
            ) : (
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => sellerActions.resolveClaim(claim.id, '거절')} className="flex h-12 w-30 items-center justify-center rounded-md border border-regular text-16 font-semibold text-main">
                  거절
                </button>
                <button type="button" onClick={() => sellerActions.resolveClaim(claim.id, '교환 제안')} className="flex h-12 w-35 items-center justify-center rounded-md border border-regular text-16 font-semibold text-main">
                  교환 제안
                </button>
                <button type="button" onClick={() => sellerActions.resolveClaim(claim.id, '반품 승인')} className="flex h-12 w-40 items-center justify-center rounded-md bg-accio text-16 font-semibold text-white active:bg-accio-strong">
                  {claim.type === '취소' ? '취소 승인' : '반품 승인'}
                </button>
              </div>
            )}
          </Card>
        )}
      </div>
    </SellerLayout>
  )
}
