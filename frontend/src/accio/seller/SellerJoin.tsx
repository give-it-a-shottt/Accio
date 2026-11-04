import { useState, type FormEvent } from 'react'
import { accioHref } from '../routes'
import { Button, TextField } from '../ui/primitives'
import SiteFooter from '../ui/SiteFooter'
import SiteHeader from '../ui/SiteHeader'
import useAuth from '../ui/useAuth'
import { sellerActions } from './sellerData'

const STEPS = ['사업자 정보', '정산 정보', '완료']
const SHIPPING = ['무료', '3,000원', '5만원 이상 무료']
const BANKS = ['국민은행', '신한은행', '우리은행', '하나은행', '카카오뱅크', '토스뱅크']

/** 123-45-67890 꼴로 */
const formatBizNo = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 10)
  return d.length < 4 ? d : d.length < 6 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

/** 판매자 가입 (Figma 431:2843) — 사업자 정보 → 정산 정보 → 완료 */
export default function SellerJoin() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ storeName: '', owner: '', bizNo: '', phone: '', shipping: SHIPPING[2], bank: BANKS[0], account: '', holder: '' })
  const [verified, setVerified] = useState<'idle' | 'ok' | 'fail'>('idle')
  const [submitted, setSubmitted] = useState(false)
  const user = useAuth()
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const step1Errors = {
    storeName: form.storeName.trim() ? undefined : '상호를 입력해 주세요',
    owner: form.owner.trim() ? undefined : '대표자명을 입력해 주세요',
    bizNo: verified === 'ok' ? undefined : verified === 'fail' ? '사업자등록번호를 다시 확인해 주세요' : '사업자등록번호를 확인해 주세요',
    phone: /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(form.phone) ? undefined : '대표 연락처를 확인해 주세요',
  }
  const step2Errors = {
    account: /^\d{10,14}$/.test(form.account.replace(/-/g, '')) ? undefined : '계좌번호를 숫자 10~14자리로 입력해 주세요',
    holder: form.holder.trim() ? undefined : '예금주를 입력해 주세요',
  }
  const errors = step === 0 ? step1Errors : step2Errors
  const show = (key: string) => (submitted ? (errors as Record<string, string | undefined>)[key] : undefined)

  const next = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return
    setSubmitted(false)
    if (step === 1)
      sellerActions.register({ email: user?.email, storeName: form.storeName.trim(), owner: form.owner.trim(), bizNo: form.bizNo, phone: form.phone, shipping: form.shipping, bank: form.bank, account: form.account })
    setStep((s) => s + 1)
  }

  return (
    <div className="min-h-svh bg-white lg:bg-light">
      <div className="bg-white">
        <SiteHeader mobileTitle="판매자 가입" />
      </div>
      <main className="flex justify-center px-5 pt-6 pb-16 lg:px-0 lg:pt-16 lg:pb-30">
        <form onSubmit={next} noValidate className="flex w-full flex-col gap-4 lg:w-auto lg:rounded-[24px] lg:bg-white lg:px-12 lg:py-10">
          <div className="flex w-full flex-col gap-4 lg:w-96">
            <ol className="flex gap-2 text-12">
              {STEPS.map((s, i) => (
                <li key={s} className={i === step ? 'font-semibold text-main' : 'text-disabled'} aria-current={i === step ? 'step' : undefined}>
                  {i + 1} {s}
                </li>
              ))}
            </ol>

            {step === 0 && (
              <>
                <div className="flex flex-col gap-2 pb-2">
                  <h1 className="text-24 font-semibold text-main">판매자로 시작하기</h1>
                  <p className="text-14 text-sub">사업자 정보를 확인한 뒤 바로 상품을 올릴 수 있어요.</p>
                </div>
                <TextField id="seller-store" label="상호" placeholder="캠프로 스토어" value={form.storeName} onChange={(e) => set('storeName', e.target.value)} error={show('storeName')} />
                <TextField id="seller-owner" label="대표자명" placeholder="김캠프" value={form.owner} onChange={(e) => set('owner', e.target.value)} error={show('owner')} />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="seller-biz" className="text-14 font-medium text-main">
                    사업자등록번호
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="seller-biz"
                      value={form.bizNo}
                      inputMode="numeric"
                      placeholder="123-45-67890"
                      onChange={(e) => {
                        set('bizNo', formatBizNo(e.target.value))
                        setVerified('idle')
                      }}
                      className={`h-12 min-w-0 flex-1 rounded-md px-4 text-15 text-main outline-none placeholder:text-disabled ${
                        show('bizNo') ? 'border-[1.5px] border-status-error' : 'border border-regular focus:border-[1.5px] focus:border-black'
                      }`}
                    />
                    {/* 목업이라 국세청 조회 대신 형식(10자리)만 본다 */}
                    <Button onClick={() => setVerified(/^\d{3}-\d{2}-\d{5}$/.test(form.bizNo) ? 'ok' : 'fail')} className="w-21 shrink-0">
                      확인
                    </Button>
                  </div>
                  {verified === 'ok' ? (
                    <p className="text-12 text-status-success">✓ 정상 사업자로 확인됐어요 (국세청 조회)</p>
                  ) : (
                    (show('bizNo') || verified === 'fail') && <p className="text-12 text-status-error">{step1Errors.bizNo}</p>
                  )}
                </div>
                <TextField id="seller-phone" label="대표 연락처" type="tel" placeholder="02-000-0000" value={form.phone} onChange={(e) => set('phone', e.target.value)} error={show('phone')} />
                <fieldset className="flex flex-col gap-2">
                  <legend className="pb-2 text-14 font-medium text-main">기본 배송비</legend>
                  <div className="flex flex-wrap gap-2">
                    {SHIPPING.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set('shipping', s)}
                        aria-pressed={form.shipping === s}
                        className={`rounded-[10px] px-3.5 py-2.5 text-14 ${form.shipping === s ? 'border-[1.5px] border-black font-semibold text-main' : 'border border-regular text-main'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <Button type="submit" variant="primary" className="h-13 w-full">
                  다음 — 정산 정보
                </Button>
              </>
            )}

            {step === 1 && (
              <>
                <div className="flex flex-col gap-2 pb-2">
                  <h1 className="text-24 font-semibold text-main">정산 받을 계좌</h1>
                  <p className="text-14 text-sub">판매 금액은 구매 확정 후 7일마다 이 계좌로 보내 드려요.</p>
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-14 font-medium text-main">은행</span>
                  <select value={form.bank} onChange={(e) => set('bank', e.target.value)} className="h-12 rounded-md border border-regular bg-white px-4 text-15 text-main outline-none focus:border-[1.5px] focus:border-black">
                    {BANKS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </label>
                <TextField id="seller-account" label="계좌번호" inputMode="numeric" placeholder="숫자만 입력" value={form.account} onChange={(e) => set('account', e.target.value)} error={show('account')} />
                <TextField id="seller-holder" label="예금주" placeholder={form.owner || '김캠프'} value={form.holder} onChange={(e) => set('holder', e.target.value)} error={show('holder')} />
                <div className="flex gap-2">
                  <Button onClick={() => setStep(0)} className="h-13 flex-1">
                    이전
                  </Button>
                  <Button type="submit" variant="primary" className="h-13 flex-1">
                    가입 완료
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <h1 className="text-24 font-semibold text-main">{form.storeName} 입점을 환영해요</h1>
                <p className="text-14 text-sub">이제 판매자센터에서 사진만 올리면 AI가 상품 정보를 채워 줘요.</p>
                <a href={accioHref('/seller/products/new')} className="mt-3 flex h-13 w-full items-center justify-center rounded-md bg-accio text-16 font-semibold text-white">
                  첫 상품 등록하기
                </a>
                <a href={accioHref('/seller')} className="flex h-12 w-full items-center justify-center rounded-md border border-regular text-16 font-semibold text-main">
                  판매자센터로
                </a>
              </div>
            )}
          </div>
        </form>
      </main>
      <div className="bg-white">
        <SiteFooter hideOnMobile />
      </div>
    </div>
  )
}
