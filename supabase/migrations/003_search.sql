-- 003 키워드 검색 함수 (S0 — LLM 없이 검색어 그대로)
-- Supabase 대시보드 > SQL Editor 에 붙여 넣어 실행한다. (002_reviews.sql 다음)
--
-- 검색어를 띄어쓰기로 나눈 낱말(2글자 이상)마다 search_text(상품명 · 브랜드 · 키워드 · 태그)에서 점수를 매긴다.
--   포함되면 1점, 아니면 글자 3개 묶음 유사도(word_similarity, 오타 · 붙여쓰기 보정)를 0.5 가중으로 더한다.
-- 걸러 내기(카테고리 · 가격 · 제외어)는 LLM 이 아니라 여기서 한다 — P3 에서 Gemini 가 해석한 값이 이 인자로 들어온다.

create or replace function public.search_products(
  q            text,
  category_in  text    default null,
  price_min    integer default null,
  price_max    integer default null,
  exclude      text[]  default '{}',
  match_limit  integer default 60
)
returns table (
  id text, name text, brand text, category text, keyword text,
  price integer, discount_rate smallint, rating numeric, review_count integer,
  delivery text[], tags text[], image_url text, score real
)
language sql stable
set search_path = public, extensions
as $$
  with terms as (
    select distinct t as term
    from unnest(regexp_split_to_array(lower(trim(coalesce(q, ''))), '\s+')) as t
    where char_length(t) >= 2
  ),
  scored as (
    select p.*,
      (
        select coalesce(sum(
          case when lower(p.search_text) like '%' || terms.term || '%' then 1.0
               else 0.5 * word_similarity(terms.term, lower(p.search_text)) end
        ), 0)
        from terms
      )::real as score
    from public.products p
    where (category_in is null or p.category = category_in)
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
  -- 낱말이 없으면(필터만 준 경우) 전부, 있으면 하나라도 걸린 것만
  where not exists (select 1 from terms) or s.score >= 0.35
  order by s.score desc, s.review_count desc
  limit greatest(1, least(match_limit, 200));
$$;

-- 누구나(anon) 부를 수 있게 — 함수 안에서 읽는 products 는 RLS 로 읽기만 허용돼 있다
grant execute on function public.search_products(text, text, integer, integer, text[], integer) to anon, authenticated;
