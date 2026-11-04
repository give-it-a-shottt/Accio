import { useEffect } from "react";
import AccioApp from "./accio/AccioApp";
import useHashRoute from "./hooks/useHashRoute";

// 해시 라우팅 — '#/list?q=캠핑 의자' 를 경로('/list')와 주소 값(q)으로 나눠 쇼핑몰에 넘긴다.
// 정적 호스팅(Vercel)에서 새로고침해도 404 가 나지 않도록 해시를 쓴다.
export default function App() {
  const route = useHashRoute();

  // 해시 라우팅은 페이지를 바꿔도 스크롤이 유지되므로 맨 위로 올린다
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  const [path, search = ""] = route.split("?");
  return <AccioApp path={path || "/"} params={new URLSearchParams(search)} />;
}
