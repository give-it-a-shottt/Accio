// 목업 AI — 서버 없이 질문 유형(의도)을 알아듣고 상품 데이터로 답한다.
// 실제 서비스(v1)는 백엔드 LLM 이 하던 일을, 포트폴리오에서는 규칙으로 흉내 낸다.
import { ALL_PRODUCTS, KIMCHI_STEW_GROUPS, PRODUCTS, type Product } from './catalog'
import { formatWon } from '../utils/format'
import { accioHref } from '../routes'

export interface ResultGroup {
  label: string
  products: Product[]
}

export interface AiReply {
  text: string[]
  /** 결과 상품 — 재료처럼 묶음이 여러 개면 탭으로 보여 준다 */
  result?: { title: string; badge?: string; groups: ResultGroup[] }
  /** '담아줘'에 대한 확인 카드 — 고른 상품 id */
  confirm?: { productIds: string[] }
  chips?: string[]
  link?: { label: string; href: string }
}

/** 질문을 낱말로 나눌 때 뺄 말(조사·요청 표현) */
const STOP_WORDS = ['찾아줘', '추천해줘', '추천', '보여줘', '알려줘', '찾아', '줘', '좀', '거', '것', '걸', '쓸', '갈', '때', '하는', '있는', '같은', '사고', '싶어', '가서']
/** 사람이 쓰는 말 → 상품명에 있는 말 */
const SYNONYMS: Record<string, string[]> = {
  가벼운: ['경량', '초경량', '가벼'],
  가벼: ['경량', '초경량'],
  의자: ['의자', '체어', '스툴'],
  이어폰: ['이어폰', '넥밴드'],
  조명: ['조명', '램프', '랜턴', '무드'],
  무드등: ['무드', '조명', '램프'],
  따뜻한: ['히터', '담요', '이불'],
  코트: ['코트', '자켓', '니트'],
}

/** 김치찌개 재료 — 재료 질문일 때만 보여 주고 일반 검색·선물 추천에서는 뺀다 */
const GROCERY_IDS = new Set(KIMCHI_STEW_GROUPS.flatMap((g) => g.products.map((p) => p.id)))

const lastResult = (history: AiReply[]) => [...history].reverse().find((r) => r.result)?.result

/** 상품명·브랜드·분야에 낱말이 몇 개 걸리는지로 점수를 매겨 고른다 */
function searchProducts(query: string) {
  const words = query
    .replace(/[?.!,~]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/(을|를|이|가|은|는|로|으로|에|에서|도|랑|하고)$/, ''))
    .filter((w) => w.length > 1 && !STOP_WORDS.includes(w))
  const scored = ALL_PRODUCTS.filter((p) => !GROCERY_IDS.has(p.id) || /고기|김치|두부|대파|고춧가루/.test(query))
    .map((product) => {
      const haystack = `${product.name} ${product.brand} ${product.category}`
      const score = words.reduce((sum, word) => {
        const variants = SYNONYMS[word] ?? [word]
        return sum + (variants.some((v) => haystack.includes(v)) ? 1 : 0)
      }, 0)
      return { product, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.product.reviewCount - a.product.reviewCount)
  return scored.map(({ product }) => product)
}

const pickTop = (groups: ResultGroup[], by: 'first' | 'cheapest') =>
  groups.map((g) => (by === 'first' ? g.products[0] : [...g.products].sort((a, b) => a.price - b.price)[0]))

function confirmText(products: Product[]) {
  const total = products.reduce((sum, p) => sum + p.price, 0)
  return `${products[0].name}${products.length > 1 ? ` 외 ${products.length - 1}개` : ''} · ${formatWon(total)}`
}
export const describePick = confirmText

/**
 * 질문 하나에 답한다. history 는 지금까지의 AI 답 — '다 담아줘', '더 저렴한 걸로'처럼
 * 앞 결과를 이어 받는 말에 쓴다. latestOrder 는 주문 조회·재구매 답에 쓴다.
 */
export function respond(question: string, history: AiReply[], latestOrder?: { no: string; firstName: string; productIds: string[] }): AiReply {
  const q = question.trim()
  const prev = lastResult(history)

  // 재료 한 번에 (다중검색)
  if (/김치찌개|재료/.test(q)) {
    return {
      text: ['2인분 김치찌개 재료를 5가지로 나눠 찾았어요. 재료 탭을 눌러 비교해 보세요.', '묵은지를 쓰면 더 깊은 맛이 나서, 김치 탭 1순위에 넣어 뒀어요.'],
      result: { title: '다중검색 결과', badge: `재료 ${KIMCHI_STEW_GROUPS.length}`, groups: KIMCHI_STEW_GROUPS },
      chips: ['제일 잘 팔리는 걸로 다 담아줘', '고기 빼고', '3인분으로'],
    }
  }

  // 앞 결과를 장바구니에 담기
  if (/담아|담기|담을래|주문해줘/.test(q) && !/또|지난번/.test(q)) {
    if (!prev) return { text: ['먼저 담을 상품을 찾아 볼게요. 무엇을 찾을까요?'], chips: ['캠핑 의자 찾아줘', '김치찌개 재료 한 번에'] }
    const picks = pickTop(prev.groups, /저렴|싼/.test(q) ? 'cheapest' : 'first')
    return {
      text: [prev.groups.length > 1 ? '각 재료에서 판매량 1위 상품을 골랐어요. 담기 전에 확인해 주세요.' : '가장 많이 팔린 상품을 골랐어요. 담기 전에 확인해 주세요.'],
      confirm: { productIds: picks.map((p) => p.id) },
      chips: ['더 저렴한 걸로', '고기 빼고', '3인분으로'],
    }
  }

  // 앞 결과를 이어서 다듬기
  if (prev && /저렴|싼|싸게/.test(q)) {
    const groups = prev.groups.map((g) => ({ ...g, products: [...g.products].sort((a, b) => a.price - b.price) }))
    return { text: ['가격이 낮은 순으로 다시 정리했어요. 맨 위가 가장 저렴해요.'], result: { ...prev, groups }, chips: ['이걸로 다 담아줘', '리뷰 많은 순으로'] }
  }
  if (prev && /리뷰 많은|인기/.test(q)) {
    const groups = prev.groups.map((g) => ({ ...g, products: [...g.products].sort((a, b) => b.reviewCount - a.reviewCount) }))
    return { text: ['리뷰가 많은 순으로 정리했어요.'], result: { ...prev, groups }, chips: ['이걸로 다 담아줘', '더 저렴한 걸로'] }
  }
  if (prev && prev.groups.length > 1 && /고기 빼/.test(q)) {
    const groups = prev.groups.filter((g) => g.label !== '돼지고기')
    return { text: ['돼지고기는 빼고 나머지 재료만 남겼어요. 참치를 넣어도 맛있어요.'], result: { ...prev, badge: `재료 ${groups.length}`, groups }, chips: ['이걸로 다 담아줘', '더 저렴한 걸로'] }
  }
  if (prev && /인분/.test(q)) {
    const people = q.match(/(\d)\s*인분/)?.[1] ?? '3'
    return { text: [`${people}인분이면 고기와 두부를 1.5배로 넉넉히 담는 게 좋아요. 장바구니에서 수량을 2개로 바꿔 주세요.`], result: prev, chips: ['이걸로 다 담아줘'] }
  }

  // 주문 조회
  if (/주문.*(어디|언제|배송)|어디까지|배송 조회/.test(q)) {
    return latestOrder
      ? {
          text: [`가장 최근 주문(${latestOrder.no}, ${latestOrder.firstName})은 오늘 출고됐어요. 내일 도착할 예정이에요.`],
          link: { label: '주문내역에서 자세히 보기', href: accioHref('/mypage') },
          chips: ['지난번 산 거 또 주문해줘'],
        }
      : { text: ['아직 주문한 상품이 없어요. 장바구니에서 주문하면 여기서 배송 상황을 알려 드릴게요.'], link: { label: '장바구니 보기', href: accioHref('/cart') } }
  }

  // 재구매
  if (/또|재구매|지난번/.test(q)) {
    const products = /휴지|화장지/.test(q) || !latestOrder ? [PRODUCTS.decoTissue] : latestOrder.productIds.map((id) => ALL_PRODUCTS.find((p) => p.id === id)).filter((p): p is Product => !!p)
    return {
      text: ['지난번에 산 상품을 찾았어요. 같은 걸로 다시 담을까요?'],
      result: { title: '지난번 산 상품', groups: [{ label: '재구매', products }] },
      confirm: { productIds: products.map((p) => p.id) },
    }
  }

  // 리뷰 요약
  if (/배송 빠르|리뷰|후기/.test(q)) {
    return {
      text: ['초경량 접이식 캠핑 의자 리뷰 1,204개 중 “배송이 빨라요”라는 말이 312번 나왔어요. 대부분 주문 다음 날 받았다고 해요.', '아쉬운 점으로는 수납 가방이 조금 좁다는 의견이 있었어요.'],
      result: { title: '리뷰를 본 상품', groups: [{ label: '캠핑 의자', products: [PRODUCTS.campingChair] }] },
      link: { label: '리뷰 전체 보기', href: `${accioHref('/detail')}?id=${PRODUCTS.campingChair.id}` },
    }
  }

  // 선물
  if (/선물|집들이/.test(q)) {
    const products = ALL_PRODUCTS.filter((p) => p.price >= 15000 && p.price < 45000 && ['생활', '가구', '식품', '가전'].includes(p.category) && !GROCERY_IDS.has(p.id)).slice(0, 8)
    const gifts = products.length ? products : [PRODUCTS.woolLamp, PRODUCTS.shineMuscat, PRODUCTS.miniHeater]
    return { text: [`3만원대 집들이 선물로 많이 고르는 걸 ${gifts.length}개 모았어요. 실패 없는 생활용품 위주예요.`], result: { title: '선물 추천', groups: [{ label: '선물', products: gifts }] }, chips: ['더 저렴한 걸로', '이걸로 다 담아줘'] }
  }

  // 로그인 안내에서 '그냥 상품 찾을래'를 고른 경우
  if (/그냥 상품/.test(q)) {
    return { text: ['좋아요. 어떤 상품을 찾을까요? 쓰임새나 예산을 말해 주면 더 잘 골라요.'], chips: ['캠핑 갈 때 쓸 가벼운 의자 찾아줘', '3만원대 집들이 선물 추천해줘'] }
  }

  // 이미지로 찾기
  if (/사진|이미지/.test(q)) {
    return { text: ['입력창 왼쪽 사진 버튼으로 사진을 올리면 비슷한 상품을 찾아 드려요.'], chips: ['캠핑 의자 찾아줘'] }
  }

  // 일반 상품 찾기
  const found = searchProducts(q)
  if (found.length > 0) {
    const isChair = /의자|체어/.test(q)
    return {
      text: [
        isChair
          ? `2kg 안팎의 가벼운 의자 ${Math.min(found.length, 3)}개를 먼저 골랐어요. 등받이가 높은 순이에요.`
          : `‘${q.replace(/\s*(찾아줘|추천해줘|보여줘|알려줘)$/, '')}’에 맞는 상품을 ${found.length}개 찾았어요. 많이 팔린 순이에요.`,
      ],
      result: { title: '검색 결과', groups: [{ label: '전체', products: found }] },
      chips: isChair ? ['더 저렴한 걸로', '이걸로 다 담아줘'] : ['더 저렴한 걸로', '리뷰 많은 순으로'],
    }
  }

  return {
    text: ['딱 맞는 상품을 찾지 못했어요. 이렇게 물어보면 더 잘 찾아요.'],
    chips: ['캠핑 갈 때 쓸 가벼운 의자 찾아줘', '3만원대 집들이 선물 추천해줘', '김치찌개 재료 한 번에 담아줘'],
  }
}

/** 사진 첨부 — 올린 사진과 분위기가 비슷한 상품(목업이라 인기 상품)을 보여 준다 */
export function respondToImage(): AiReply {
  const products = [PRODUCTS.woolLamp, PRODUCTS.campingLantern, PRODUCTS.woolHalfCoat, PRODUCTS.catScratcher]
  return { text: ['올린 사진과 색감·모양이 비슷한 상품을 골랐어요.'], result: { title: '비슷한 상품', groups: [{ label: '전체', products }] }, chips: ['더 저렴한 걸로'] }
}

/** 첫 화면 질문 예시 — '이미지로 찾기'는 질문 대신 사진 첨부를 연다 */
export const STARTERS = [
  { label: '상품 찾기', question: '3만원대 집들이 선물 추천해줘' },
  { label: '재료 한 번에', question: '김치찌개 재료 한 번에 담아줘' },
  { label: '이미지로 찾기', question: '이 사진이랑 비슷한 가방 (사진 첨부)' },
  { label: '내 주문', question: '내 주문 어디까지 왔어?' },
  { label: '재구매', question: '지난번 산 휴지 또 주문해줘' },
  { label: '리뷰 요약', question: '이 의자 배송 빠르대?' },
]
