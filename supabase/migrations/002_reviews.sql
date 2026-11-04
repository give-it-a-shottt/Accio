-- 002 리뷰 테이블 — Gemini 로 만든 데모용 리뷰(data/reviews.json). 상품마다 4~5개.
-- Supabase 대시보드 > SQL Editor 에 붙여 넣어 실행한다. (001_products.sql 다음)

create table if not exists public.reviews (
  id          text primary key,                                   -- 'g-0001-r1'
  product_id  text not null references public.products (id) on delete cascade,
  author      text not null,                                      -- 지어낸 닉네임
  rating      smallint not null check (rating between 1 and 5),
  days_ago    integer not null,                                   -- 며칠 전에 썼는지(화면에서 '2주 전'으로)
  body        text not null,
  highlight   text,                                               -- 본문에서 강조할 구절(AI 요약 키워드와 겹치는 말)
  helpful     integer not null default 0,                         -- '도움돼요' 수
  topics      text[] not null default '{}',                       -- 품질 · 배송 · 가성비 · 디자인 · 사이즈
  created_at  timestamptz not null default now()
);

create index if not exists reviews_product_idx on public.reviews (product_id);

-- 누구나 읽기만 — 쓰기는 적재 스크립트(secret 키)만
alter table public.reviews enable row level security;
drop policy if exists "reviews are readable by everyone" on public.reviews;
create policy "reviews are readable by everyone" on public.reviews for select to anon, authenticated using (true);
