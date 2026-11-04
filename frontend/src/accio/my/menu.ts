// 마이페이지 메뉴 — PC 왼쪽 메뉴와 모바일 마이페이지 목록이 같이 쓴다
export const MY_MENU = [
  { group: '쇼핑 내역', items: [{ label: '주문내역', path: '/mypage/orders' }, { label: '취소·반품 내역', path: '/mypage/claims' }, { label: '재구매', path: '/mypage/reorder' }] },
  { group: '관심 상품', items: [{ label: '찜', path: '/mypage/wishlist' }, { label: '최근 본 상품', path: '/mypage/recent' }] },
  { group: '활동', items: [{ label: '내 리뷰', path: '/mypage/reviews' }] },
  { group: '기타', items: [{ label: '고객센터', path: '/support' }, { label: '판매자센터', path: '/seller' }] },
]
