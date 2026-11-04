-- 004 검색 함수 v2 — 상품 종류 필터 + 구절 그대로 점수 (P3 보강)
-- Supabase 대시보드 > SQL Editor 에 붙여 넣어 실행한다. (003_search.sql 다음, 003 함수를 바꾼다)
--
-- 003 에서 본 문제(S1):
--   ① 특징 낱말('미니' · '초경량')이 다른 종류(가습기 · 코펠)에도 걸려 섞임 → keyword_in(상품 종류) 필터
--   ② '캠핑 의자'를 '캠핑' · '의자'로 쪼개 '캠핑'만 맞는 테이블도 점수 → terms 는 쪼개지 않고 구절 그대로
-- terms 가 없으면(S0 · Gemini 실패) 예전처럼 q 를 띄어쓰기로 쪼갠다.

drop function if exists public.search_products(text, text, integer, integer, text[], integer);

create or replace function public.search_products(
  q            text,
  category_in  text    default null,
  price_min    integer default null,
  price_max    integer default null,
  exclude      text[]  default '{}',
  match_limit  integer default 60,
  keyword_in   text[]  default null,   -- Gemini 가 고른 상품 종류(products.keyword). 있으면 그 종류만
  terms        text[]  default null    -- Gemini 가 고른 찾을 낱말 · 구절. 있으면 q 대신 이걸로 점수
)
returns table (
  id text, name text, brand text, category text, keyword text,
  price integer, discount_rate smallint, rating numeric, review_count integer,
  delivery text[], tags text[], image_url text, score real
)
language sql stable
set search_path = public, extensions
as $$
  with words as (
    select distinct lower(trim(t)) as term
    from unnest(
      case when terms is not null and cardinality(terms) > 0 then terms
           else regexp_split_to_array(lower(trim(coalesce(q, ''))), '\s+') end
    ) as t
    where char_length(trim(t)) >= 2
  ),
  scored as (
    select p.*,
      (
        select coalesce(sum(
          case when lower(p.search_text) like '%' || words.term || '%' then 1.0
               else 0.5 * word_similarity(words.term, lower(p.search_text)) end
        ), 0)
        from words
      )::real as score
    from public.products p
    where (category_in is null or p.category = category_in)
      and (keyword_in is null or cardinality(keyword_in) = 0 or p.keyword = any(keyword_in))
      and (price_min is null or p.price >= price_min)
      and (price_max is null or p.price <= price_max)
      and not exists (
        select 1 from unnest(exclude) as e
        where char_length(e) > 0 and lower(p.search_text) like '%' || lower(e) || '%'
      )
  )
  select s.id, s.name, s.brand, s.category, s.keyword,
         s.price, s.discount_rate, s.rating, s.review_count,
         s.delivery, s.tags, s.image_url, s.score
  from scored s
  -- 종류가 정해졌으면 그 종류는 모두(점수로 순서만), 아니면 낱말이 하나라도 걸린 것만
  where (keyword_in is not null and cardinality(keyword_in) > 0)
     or not exists (select 1 from words)
     or s.score >= 0.35
  order by s.score desc, s.review_count desc
  limit greatest(1, least(match_limit, 200));
$$;

grant execute on function public.search_products(text, text, integer, integer, text[], integer, text[], text[])
  to anon, authenticated;
