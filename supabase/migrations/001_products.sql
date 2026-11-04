-- 001 상품 테이블 — 네이버 쇼핑 검색 API 로 모은 검색용 상품
-- Supabase 대시보드 > SQL Editor 에 붙여 넣어 실행한다.

create extension if not exists pg_trgm with schema extensions;  -- 한국어 키워드 검색(글자 3개 묶음 유사도)
create extension if not exists vector with schema extensions;   -- 임베딩 검색(P4)

create table if not exists public.products (
  id                  text primary key,            -- 'naver-{productId}' — 목 데이터 id 와 겹치지 않게 접두어
  naver_product_id    text not null unique,
  title               text not null,               -- <b> 태그를 뺀 상품명
  brand               text not null default '',
  maker               text not null default '',
  mall_name           text not null default '',
  lprice              integer not null,             -- 최저가(원)
  hprice              integer,                      -- 최고가(원). 네이버가 안 주면 null
  image_url           text not null,
  link                text not null,                -- 네이버 쇼핑 상품 페이지
  category            text not null,                -- 우리 카테고리 11개(수집할 때 쓴 분류)
  naver_category_path text not null default '',     -- '생활/건강 > 캠핑 > 캠핑의자' — 참고용
  seed_keyword        text not null,                -- 이 상품을 모은 검색어
  tags                text[] not null default '{}', -- 용도 태그(P4, Gemini)
  embedding           extensions.vector(768),       -- 임베딩(P4, Gemini)
  collected_at        timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_lprice_idx on public.products (lprice);
create index if not exists products_title_trgm_idx on public.products using gin (title extensions.gin_trgm_ops);
create index if not exists products_embedding_idx on public.products using hnsw (embedding extensions.vector_cosine_ops);

-- 누구나 읽기만 — 쓰기는 service_role(적재 스크립트)만 한다. RLS 를 켜면 정책이 없는 쓰기는 모두 막힌다.
alter table public.products enable row level security;
drop policy if exists "products are readable by everyone" on public.products;
create policy "products are readable by everyone" on public.products for select to anon, authenticated using (true);
