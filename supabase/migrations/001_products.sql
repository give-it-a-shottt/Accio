-- 001 상품 테이블 — Gemini 로 만든 데모용 가상 상품(data/products.json) + 상품 이미지(data/images.json)
-- Supabase 대시보드 > SQL Editor 에 붙여 넣어 실행한다.

create extension if not exists pg_trgm with schema extensions;  -- 한국어 키워드 검색(글자 3개 묶음 유사도)
create extension if not exists vector with schema extensions;   -- 임베딩 검색(P4)

create table if not exists public.products (
  id                text primary key,                -- 'g-0001' — 목 데이터 id 와 겹치지 않게 접두어
  name              text not null,
  brand             text not null,                   -- 지어낸 브랜드
  category          text not null,                   -- 우리 카테고리 11개(프론트 Category 타입)
  keyword           text not null,                   -- 이 상품을 만든 세부 키워드
  price             integer not null,                -- 판매가(원)
  discount_rate     smallint not null default 0,     -- 정가 대비 할인율(%)
  rating            numeric(2, 1) not null default 0,
  review_count      integer not null default 0,
  delivery          text[] not null default '{}',    -- '무료배송' · '오늘 출발' · '내일 도착'
  description       text not null default '',
  specs             jsonb not null default '[]',     -- [{label, value}]
  tags              text[] not null default '{}',    -- 용도 · 상황 · 대상 태그
  search_text       text not null,                   -- 상품명 · 브랜드 · 태그를 이은 키워드 검색용 글(적재 스크립트가 채움)
  image_url         text not null,                   -- /products/{슬러그}-1.webp (frontend/public) 또는 외부 사진 주소
  image_alt         text not null default '',
  photographer      text not null default '',
  photographer_url  text not null default '',
  photo_page_url    text not null default '',
  embedding         extensions.vector(768),          -- 임베딩(P4, gemini-embedding-001)
  created_at        timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_price_idx on public.products (price);
create index if not exists products_search_trgm_idx on public.products using gin (search_text extensions.gin_trgm_ops);
create index if not exists products_embedding_idx on public.products using hnsw (embedding extensions.vector_cosine_ops);

-- 누구나 읽기만 — 쓰기는 service_role(적재 스크립트)만 한다. RLS 를 켜면 정책이 없는 쓰기는 모두 막힌다.
alter table public.products enable row level security;
drop policy if exists "products are readable by everyone" on public.products;
create policy "products are readable by everyone" on public.products for select to anon, authenticated using (true);
