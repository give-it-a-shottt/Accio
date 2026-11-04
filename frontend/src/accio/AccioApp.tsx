import SupportPage from "./pages/SupportPage";
import AiPage from "./ai/AiPage";
import HomePage from "./home/HomePage";
import { ClaimsPage, MyHomePage, OrdersPage, RecentPage, ReorderPage, ReviewsPage, WishlistPage } from "./my/MyPages";
import { LoginPage, SignupPage } from "./pages/AuthPages";
import CartPage from "./pages/CartPage";
import DetailPage from "./pages/DetailPage";
import ListPage from "./pages/ListPage";
import SellerJoin from "./seller/SellerJoin";
import { SellerClaims, SellerDashboard, SellerOrders, SellerProductNew, SellerProducts } from "./seller/SellerPages";
import { OrderCompletePage, OrderFailPage } from "./pages/OrderResultPage";
import { useEffect } from "react";
import { ToastHost } from "./ui/states";
import { hideToast, showToast } from "./ui/toast";

interface AccioAppProps {
  /** '#' 뒤의 경로. '/' 는 쇼핑몰 홈 */
  path: string;
  /** 주소의 ?뒤 값 — 목록·AI 는 q(검색어·질문), 상세는 id(상품)를 읽는다 */
  params: URLSearchParams;
}

// Accio 쇼핑몰 — '#/…' 해시 경로로 화면을 고른다. 토스트는 화면이 바뀌어도 남도록 여기서 한 번 그린다.
export default function AccioApp(props: AccioAppProps) {
  // 연결이 끊기면 오류 토스트를 닫을 때까지 띄우고, 다시 붙으면 거둔다 (상태 시안 439:3392)
  useEffect(() => {
    const offline = () => showToast({ message: "인터넷 연결이 끊겼어요", error: true });
    window.addEventListener("offline", offline);
    window.addEventListener("online", hideToast);
    return () => {
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", hideToast);
    };
  }, []);

  return (
    <>
      <AccioRoute {...props} />
      <ToastHost />
    </>
  );
}

// 경로별 화면 — 모르는 경로는 쇼핑몰 홈으로 보낸다
function AccioRoute({ path, params }: AccioAppProps) {
  if (path === "/login") return <LoginPage next={params.get("next") ?? ""} />;
  if (path === "/signup") return <SignupPage />;
  if (path === "/list") {
    const query = params.get("q") ?? "";
    // 검색어가 바뀌면 필터·페이지를 새로 시작하도록 key 로 다시 만든다
    return <ListPage key={query} query={query} />;
  }
  if (path === "/detail") {
    const id = params.get("id") ?? undefined;
    return <DetailPage key={id} productId={id} />;
  }
  if (path === "/ai") return <AiPage initialQuestion={params.get("q") ?? undefined} resume={params.get("resume") ?? undefined} />;
  if (path === "/cart") return <CartPage />;
  if (path === "/mypage") return <MyHomePage />;
  if (path === "/mypage/orders" || path === "/order") return <OrdersPage />;
  if (path === "/mypage/claims") return <ClaimsPage />;
  if (path === "/mypage/reorder") return <ReorderPage />;
  if (path === "/mypage/wishlist") return <WishlistPage />;
  if (path === "/mypage/recent") return <RecentPage />;
  if (path === "/mypage/reviews") return <ReviewsPage />;
  if (path === "/order/complete") return <OrderCompletePage orderNo={params.get("no") ?? undefined} />;
  if (path === "/order/fail") return <OrderFailPage code={params.get("code") ?? undefined} />;
  if (path === "/support") return <SupportPage />;
  if (path === "/seller") return <SellerDashboard />;
  if (path === "/seller/join") return <SellerJoin />;
  if (path === "/seller/products") return <SellerProducts />;
  if (path === "/seller/products/new") return <SellerProductNew />;
  if (path === "/seller/orders") return <SellerOrders />;
  if (path === "/seller/claims") return <SellerClaims />;

  return <HomePage />;
}
