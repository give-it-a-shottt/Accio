import { useState, type FormEvent, type ReactNode } from 'react'
import { accioHref } from '../routes'
import { Button, CheckMark, Logo, TextField } from '../ui/primitives'
import SiteFooter from '../ui/SiteFooter'
import SiteHeader from '../ui/SiteHeader'
import { Spinner } from '../ui/states'
import useAuth, { authActions, DEMO_LOGIN, EMAIL_PATTERN, isTakenEmail, isValidPassword } from '../ui/useAuth'

const go = (path: string) => {
  window.location.hash = accioHref(path)
}

/** PC 는 회색 바탕 가운데 흰 카드, 모바일은 카드 없이 화면 전체 */
function AuthLayout({ mobileTitle, children, paddingTop }: { mobileTitle: string; children: ReactNode; paddingTop: string }) {
  return (
    <div className="min-h-svh bg-white lg:bg-light">
      <div className="bg-white">
        <SiteHeader mobileTitle={mobileTitle} />
      </div>
      <main className={`flex justify-center px-5 pt-6 pb-16 lg:px-0 lg:pb-30 ${paddingTop}`}>
        <div className="w-full lg:w-auto lg:rounded-[24px] lg:bg-white lg:px-12 lg:py-10">
          <div className="flex w-full flex-col gap-4 lg:w-96">{children}</div>
        </div>
      </main>
      <div className="bg-white">
        <SiteFooter hideOnMobile />
      </div>
    </div>
  )
}

function CheckLabel({ checked, onChange, children, className = '' }: { checked: boolean; onChange: () => void; children: ReactNode; className?: string }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 ${className}`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <CheckMark checked={checked} />
      {children}
    </label>
  )
}

/** 로그인 (Figma PC 425:1349 · MO 425:1507) — 예시 계정 abc@accio.kr / accio1234 */
export function LoginPage({ next = '' }: { next?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keep, setKeep] = useState(true)
  const [error, setError] = useState<{ field: 'email' | 'password'; message: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const user = useAuth()

  // 제출 중 (상태 시안 439:3428) — 버튼 안 스피너 + 입력 잠금. 두 번 눌러도 요청은 한 번만 간다
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!EMAIL_PATTERN.test(email.trim())) return setError({ field: 'email', message: '이메일 형식을 확인해 주세요' })
    if (!password) return setError({ field: 'password', message: '비밀번호를 입력해 주세요' })
    setSubmitting(true)
    window.setTimeout(() => {
      const result = authActions.login(email, password, keep)
      setSubmitting(false)
      if (result.ok) go(next)
      else setError({ field: result.field, message: result.message })
    }, 700)
  }

  return (
    <AuthLayout mobileTitle="로그인" paddingTop="lg:pt-20">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="hidden justify-center pb-2 lg:flex">
          <Logo height={43} />
        </div>
        <div className="flex flex-col gap-1.5 pb-2">
          <h1 className="text-24 font-semibold text-main">다시 만나서 반가워요</h1>
          <p className="text-14 text-sub">로그인하면 AI 추천이 더 정확해져요</p>
        </div>
        {/* 포트폴리오 데모 — 가입하지 않고도 바로 들어가 볼 수 있게 예시 계정을 눈에 띄게 둔다 */}
        <div className="flex items-center gap-3 rounded-md bg-accio-soft px-4 py-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-13 font-semibold text-accio-strong">예시 계정으로 둘러보세요</p>
            <p className="truncate text-13 text-main tabular-nums">
              {DEMO_LOGIN.email} · {DEMO_LOGIN.password}
            </p>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              setEmail(DEMO_LOGIN.email)
              setPassword(DEMO_LOGIN.password)
              setError(null)
            }}
            className="shrink-0 rounded-sm border border-regular bg-white px-3 py-2 text-13 font-semibold text-main disabled:opacity-40"
          >
            자동 입력
          </button>
        </div>
        {user && (
          <p className="rounded-md bg-light px-4 py-3 text-14 text-sub">
            지금 <strong className="font-semibold text-main">{user.name}</strong>님으로 로그인되어 있어요.
          </p>
        )}
        <TextField
          id="login-email"
          label="이메일"
          disabled={submitting}
          type="email"
          autoComplete="email"
          placeholder="abc@accio.kr"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(null)
          }}
          error={error?.field === 'email' ? error.message : undefined}
        />
        <TextField
          id="login-password"
          label="비밀번호"
          disabled={submitting}
          type="password"
          autoComplete="current-password"
          placeholder="입력해 주세요"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(null)
          }}
          error={error?.field === 'password' ? error.message : undefined}
        />
        <div className="flex items-center justify-between">
          <CheckLabel checked={keep} onChange={() => setKeep((v) => !v)} className="text-14 text-sub">
            로그인 유지
          </CheckLabel>
          <a href={accioHref('/support')} className="text-14 text-sub-weak">
            비밀번호 찾기
          </a>
        </div>
        {submitting ? (
          <button type="submit" aria-disabled="true" className="flex h-13 w-full items-center justify-center gap-2 rounded-md bg-accio-hover text-16 font-semibold text-white">
            <Spinner size={18} />
            로그인 중…
          </button>
        ) : (
          <Button type="submit" variant="primary" className="h-13 w-full">
            로그인
          </Button>
        )}
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-regular" />
          <span className="text-12 text-sub-weak">또는</span>
          <span className="h-px flex-1 bg-regular" />
        </div>
        <div className="flex gap-2">
          {['카카오로 시작', '구글로 시작'].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                authActions.socialLogin()
                go(next)
              }}
              className="flex h-12 flex-1 items-center justify-center rounded-md border border-regular text-15 font-medium text-main"
            >
              {label}
            </button>
          ))}
        </div>
        <p className="flex justify-center gap-1.5 pt-2 text-14">
          <span className="text-sub">아직 회원이 아니신가요?</span>
          <a href={accioHref('/signup')} className="font-semibold text-main">
            회원가입
          </a>
        </p>
      </form>
    </AuthLayout>
  )
}

const AGREEMENTS = [
  { key: 'terms', label: '이용약관 동의', required: true },
  { key: 'privacy', label: '개인정보 수집·이용 동의', required: true },
  { key: 'marketing', label: '마케팅 정보 수신', required: false },
] as const
type AgreementKey = (typeof AGREEMENTS)[number]['key']

/** 숫자만 남겨 010-0000-0000 꼴로 */
const formatPhone = (value: string) => {
  const d = value.replace(/\D/g, '').slice(0, 11)
  return d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

/** 회원가입 (Figma PC 425:1562 · MO 425:1736) — 입력하는 동안 칸마다 바로 확인한다 */
export function SignupPage() {
  const [form, setForm] = useState({ email: '', password: '', confirm: '', name: '', phone: '', address: '', detail: '' })
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [agree, setAgree] = useState<Record<AgreementKey, boolean>>({ terms: false, privacy: false, marketing: false })
  const [submitted, setSubmitted] = useState(false)

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: key === 'phone' ? formatPhone(e.target.value) : e.target.value }))
  const touch = (key: string) => () => setTouched((t) => ({ ...t, [key]: true }))
  const show = (key: string) => touched[key] || submitted

  const emailError = !form.email
    ? '이메일을 입력해 주세요'
    : !EMAIL_PATTERN.test(form.email.trim())
      ? '이메일 형식을 확인해 주세요'
      : isTakenEmail(form.email)
        ? '이미 가입된 이메일이에요'
        : undefined
  const errors: Record<string, string | undefined> = {
    email: emailError,
    password: isValidPassword(form.password) ? undefined : '영문·숫자 포함 8자 이상으로 입력해 주세요',
    confirm: form.confirm && form.confirm === form.password ? undefined : '비밀번호가 같지 않아요',
    name: form.name.trim() ? undefined : '이름을 입력해 주세요',
    phone: /^01\d-\d{3,4}-\d{4}$/.test(form.phone) ? undefined : '휴대폰 번호를 확인해 주세요',
  }
  const allAgreed = AGREEMENTS.every((a) => agree[a.key])
  const requiredAgreed = AGREEMENTS.every((a) => !a.required || agree[a.key])
  const valid = Object.values(errors).every((e) => !e) && requiredAgreed

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!valid) return
    authActions.signup({
      email: form.email,
      password: form.password,
      name: form.name.trim(),
      phone: form.phone,
      address: [form.address, form.detail].filter(Boolean).join(' '),
    })
    go('')
  }

  return (
    <AuthLayout mobileTitle="회원가입" paddingTop="lg:pt-16">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 pb-2">
          <h1 className="text-24 font-semibold text-main">회원가입</h1>
          <p className="text-14 text-sub">가입하면 첫 구매 10% 쿠폰을 드려요</p>
        </div>
        <TextField
          id="signup-email"
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="abc@accio.kr"
          value={form.email}
          onChange={set('email')}
          onBlur={touch('email')}
          error={show('email') ? errors.email : undefined}
          helper={!errors.email ? '사용할 수 있는 이메일이에요' : undefined}
        />
        <TextField
          id="signup-password"
          label="비밀번호"
          type="password"
          autoComplete="new-password"
          placeholder="입력해 주세요"
          value={form.password}
          onChange={set('password')}
          onBlur={touch('password')}
          error={show('password') ? errors.password : undefined}
          helper="영문·숫자 포함 8자 이상"
        />
        <TextField
          id="signup-confirm"
          label="비밀번호 확인"
          type="password"
          autoComplete="new-password"
          placeholder="입력해 주세요"
          value={form.confirm}
          onChange={set('confirm')}
          onBlur={touch('confirm')}
          error={show('confirm') ? errors.confirm : undefined}
        />
        <TextField id="signup-name" label="이름" autoComplete="name" placeholder="입력해 주세요" value={form.name} onChange={set('name')} onBlur={touch('name')} error={show('name') ? errors.name : undefined} />
        <TextField
          id="signup-phone"
          label="휴대폰 번호"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="010-0000-0000"
          value={form.phone}
          onChange={set('phone')}
          onBlur={touch('phone')}
          error={show('phone') ? errors.phone : undefined}
        />

        <div className="flex flex-col gap-1.5">
          <p className="text-14 font-medium text-main">주소</p>
          <div className="flex gap-2">
            <p className={`flex h-12 min-w-0 flex-1 items-center truncate rounded-md bg-light px-4 text-15 ${form.address ? 'text-main' : 'text-disabled'}`}>
              {form.address || '우편번호 검색'}
            </p>
            {/* 목업이라 주소 검색 대신 예시 주소를 채운다 */}
            <Button onClick={() => setForm((f) => ({ ...f, address: '(04779) 서울특별시 성동구 왕십리로 83-21' }))} className="w-30 shrink-0">
              주소 찾기
            </Button>
          </div>
          {form.address && (
            <input
              aria-label="상세 주소"
              placeholder="상세 주소 (동·호수)"
              value={form.detail}
              onChange={set('detail')}
              className="mt-1 h-12 w-full rounded-md border border-regular px-4 text-15 text-main outline-none placeholder:text-disabled focus:border-[1.5px] focus:border-black"
            />
          )}
        </div>

        <fieldset className="flex flex-col gap-3 rounded-md bg-light p-4">
          <legend className="sr-only">약관 동의</legend>
          <CheckLabel
            checked={allAgreed}
            onChange={() => setAgree({ terms: !allAgreed, privacy: !allAgreed, marketing: !allAgreed })}
            className="text-15 font-semibold text-main"
          >
            전체 동의
          </CheckLabel>
          <span aria-hidden className="h-px bg-regular" />
          {AGREEMENTS.map((a) => (
            <CheckLabel key={a.key} checked={agree[a.key]} onChange={() => setAgree((v) => ({ ...v, [a.key]: !v[a.key] }))} className="text-14 text-sub">
              {a.label}
              <span className={`text-12 font-medium ${a.required ? 'text-main' : 'text-sub-weak'}`}>{a.required ? '필수' : '선택'}</span>
            </CheckLabel>
          ))}
          {submitted && !requiredAgreed && <p className="text-12 text-status-error">필수 약관에 동의해 주세요</p>}
        </fieldset>

        <Button type="submit" variant="primary" className="h-13 w-full">
          가입하기
        </Button>
        <p className="flex justify-center gap-1.5 text-14">
          <span className="text-sub">이미 회원이신가요?</span>
          <a href={accioHref('/login')} className="font-semibold text-main">
            로그인
          </a>
        </p>
      </form>
    </AuthLayout>
  )
}
