-- ============================================
-- Renty — Product Analytics Foundation (Phase 1A-1C)
-- Run this AFTER 008_photo_thumb_url.sql in Supabase SQL Editor.
-- ============================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------
-- 1) listing_events: product funnel events with anonymous identities
-- -------------------------------------------------------------------
create table if not exists public.listing_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_name text not null,
  source text not null,
  anonymous_id text not null,
  session_id text not null,
  listing_id uuid references public.listings(id) on delete set null,
  page_path text not null,
  referrer text,
  position int,
  search_query text,
  max_price_cop int,
  min_bedrooms int,
  result_count int,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  payload jsonb not null default '{}'::jsonb,
  constraint listing_events_name_chk check (
    event_name in (
      'search_results_viewed',
      'filter_applied',
      'listing_card_impression',
      'listing_card_click',
      'listing_detail_view',
      'gallery_opened',
      'whatsapp_click',
      'publish_cta_click',
      'publish_page_view'
    )
  ),
  constraint listing_events_source_chk check (char_length(trim(source)) between 2 and 80),
  constraint listing_events_anonymous_id_chk check (
    char_length(trim(anonymous_id)) between 8 and 120
  ),
  constraint listing_events_session_id_chk check (
    char_length(trim(session_id)) between 8 and 120
  ),
  constraint listing_events_page_path_chk check (page_path like '/%'),
  constraint listing_events_position_chk check (position is null or position > 0),
  constraint listing_events_max_price_chk check (
    max_price_cop is null or max_price_cop >= 0
  ),
  constraint listing_events_min_bedrooms_chk check (
    min_bedrooms is null or min_bedrooms >= 0
  ),
  constraint listing_events_result_count_chk check (
    result_count is null or result_count >= 0
  )
);

create index if not exists idx_listing_events_created_at
  on public.listing_events (created_at desc);

create index if not exists idx_listing_events_name_created_at
  on public.listing_events (event_name, created_at desc);

create index if not exists idx_listing_events_listing_name_created_at
  on public.listing_events (listing_id, event_name, created_at desc)
  where listing_id is not null;

create index if not exists idx_listing_events_session_created_at
  on public.listing_events (session_id, created_at desc);

create index if not exists idx_listing_events_anonymous_created_at
  on public.listing_events (anonymous_id, created_at desc);

alter table public.listing_events enable row level security;

grant insert on public.listing_events to anon, authenticated;
grant select on public.listing_events to authenticated;

drop policy if exists "Admins can read listing events" on public.listing_events;
create policy "Admins can read listing events"
  on public.listing_events
  for select
  to authenticated
  using (public.is_admin_or_editor());

drop policy if exists "Public can insert listing events" on public.listing_events;
create policy "Public can insert listing events"
  on public.listing_events
  for insert
  to anon, authenticated
  with check (
    event_name in (
      'search_results_viewed',
      'filter_applied',
      'listing_card_impression',
      'listing_card_click',
      'listing_detail_view',
      'gallery_opened',
      'whatsapp_click',
      'publish_cta_click',
      'publish_page_view'
    )
    and page_path like '/%'
    and char_length(trim(source)) between 2 and 80
    and char_length(trim(anonymous_id)) between 8 and 120
    and char_length(trim(session_id)) between 8 and 120
  );

-- -------------------------------------------------------------------
-- 2) listing_daily_stats: query-friendly daily aggregates for ranking
-- -------------------------------------------------------------------
create or replace view public.listing_daily_stats
with (security_invoker = true) as
with daily_rollup as (
  select
    date_trunc('day', created_at)::date as day,
    listing_id,
    count(*) filter (where event_name = 'listing_card_impression') as card_impressions,
    count(*) filter (where event_name = 'listing_card_click') as card_clicks,
    count(*) filter (where event_name = 'listing_detail_view') as detail_views,
    count(*) filter (where event_name = 'gallery_opened') as gallery_opens,
    count(*) filter (where event_name = 'whatsapp_click') as whatsapp_clicks
  from public.listing_events
  where listing_id is not null
  group by 1, 2
)
select
  day,
  listing_id,
  card_impressions,
  card_clicks,
  detail_views,
  gallery_opens,
  whatsapp_clicks,
  case
    when card_impressions = 0 then 0
    else round(card_clicks::numeric / card_impressions::numeric, 4)
  end as card_ctr,
  case
    when detail_views = 0 then 0
    else round(whatsapp_clicks::numeric / detail_views::numeric, 4)
  end as detail_to_whatsapp_rate,
  case
    when card_clicks = 0 then 0
    else round(detail_views::numeric / card_clicks::numeric, 4)
  end as click_to_detail_rate
from daily_rollup;

grant select on public.listing_daily_stats to authenticated;

-- -------------------------------------------------------------------
-- 3) listing_quality_scores: derived quality score from existing fields
-- -------------------------------------------------------------------
create or replace view public.listing_quality_scores
with (security_invoker = true) as
with photo_stats as (
  select
    lp.listing_id,
    count(*)::int as photo_count,
    count(*) filter (where lp.is_cover)::int as cover_count,
    count(distinct coalesce(lp.room_type, 'other'))::int as photo_room_type_count
  from public.listing_photos lp
  group by lp.listing_id
),
poi_stats as (
  select
    p.listing_id,
    count(*)::int as poi_count,
    count(distinct p.kind)::int as poi_kind_count
  from public.listing_pois p
  group by p.listing_id
),
score_inputs as (
  select
    l.id as listing_id,
    l.status,
    l.title,
    l.listing_kind,
    l.property_type,
    l.neighborhood,
    l.city,
    l.zone,
    l.approx_location,
    l.description,
    l.price_cop,
    l.admin_fee_cop,
    l.utilities_cop_min,
    l.utilities_cop_max,
    l.utilities_notes,
    l.area_m2,
    l.bedrooms,
    l.bathrooms,
    l.includes,
    l.requirements,
    l.requirements_notes,
    l.available_from,
    l.published_at,
    l.updated_at,
    l.whatsapp_e164,
    l.cover_photo_url,
    coalesce(ps.photo_count, 0) as photo_count,
    coalesce(ps.cover_count, 0) as cover_count,
    coalesce(ps.photo_room_type_count, 0) as photo_room_type_count,
    coalesce(pois.poi_count, 0) as poi_count,
    coalesce(pois.poi_kind_count, 0) as poi_kind_count,
    char_length(coalesce(nullif(trim(l.description), ''), '')) as description_length,
    cardinality(coalesce(l.includes, '{}')) as include_count,
    cardinality(coalesce(l.requirements, '{}')) as requirement_count,
    case
      when l.listing_kind in ('room_private', 'room_shared') then false
      else true
    end as area_expected
  from public.listings l
  left join photo_stats ps on ps.listing_id = l.id
  left join poi_stats pois on pois.listing_id = l.id
),
score_components as (
  select
    *,
    (
      case when char_length(trim(title)) >= 12 then 5 else 0 end +
      case when description_length >= 140 then 14 when description_length >= 80 then 8 else 0 end +
      case when char_length(trim(approx_location)) >= 8 then 5 else 0 end +
      case when bedrooms > 0 or listing_kind in ('room_private', 'room_shared', 'studio') then 5 else 0 end +
      case when bathrooms > 0 then 6 else 0 end
    )::int as content_score,
    (
      case when char_length(trim(cover_photo_url)) > 0 or cover_count > 0 then 8 else 0 end +
      case when photo_count >= 5 then 11 when photo_count >= 3 then 7 when photo_count >= 1 then 3 else 0 end +
      case when photo_room_type_count >= 3 then 6 when photo_room_type_count >= 2 then 3 else 0 end
    )::int as media_score,
    (
      case when price_cop > 0 then 5 else 0 end +
      case when admin_fee_cop >= 0 then 3 else 0 end +
      case
        when utilities_cop_min is not null or utilities_cop_max is not null or char_length(coalesce(utilities_notes, '')) >= 12
          then 4
        else 0
      end +
      case when available_from is not null or published_at is not null then 3 else 0 end
    )::int as pricing_score,
    (
      case when char_length(trim(neighborhood)) >= 3 and char_length(trim(city)) >= 3 then 4 else 0 end +
      case when char_length(trim(approx_location)) >= 8 then 3 else 0 end +
      case when char_length(coalesce(zone, '')) >= 3 then 2 else 0 end +
      case when poi_count >= 3 then 4 when poi_count >= 1 then 2 else 0 end +
      case when poi_kind_count >= 2 then 2 else 0 end
    )::int as location_score,
    (
      case
        when area_expected and area_m2 is not null and area_m2 > 0 then 3
        when not area_expected then 3
        else 0
      end +
      case when include_count >= 3 then 3 when include_count >= 1 then 2 else 0 end +
      case when requirement_count >= 1 or char_length(coalesce(requirements_notes, '')) >= 12 then 2 else 0 end +
      case when char_length(trim(whatsapp_e164)) >= 10 then 2 else 0 end
    )::int as trust_score,
    (
      case
        when updated_at >= now() - interval '14 days' then 4
        when updated_at >= now() - interval '30 days' then 2
        else 0
      end
    )::int as freshness_score
  from score_inputs
)
select
  listing_id,
  status,
  title,
  listing_kind,
  neighborhood,
  city,
  photo_count,
  poi_count,
  description_length,
  content_score,
  media_score,
  pricing_score,
  location_score,
  trust_score,
  freshness_score,
  (content_score + media_score + pricing_score + location_score + trust_score + freshness_score)::int as quality_score,
  round(
    ((content_score + media_score + pricing_score + location_score + trust_score + freshness_score)::numeric / 100)::numeric,
    4
  ) as quality_ratio,
  case
    when (content_score + media_score + pricing_score + location_score + trust_score + freshness_score) >= 85 then 'alto'
    when (content_score + media_score + pricing_score + location_score + trust_score + freshness_score) >= 65 then 'medio'
    else 'bajo'
  end as quality_band,
  array_remove(
    array[
      case
        when description_length < 140 then 'Descripción corta: agrega más contexto, reglas y beneficios del inmueble.'
      end,
      case
        when photo_count < 5 then 'Agrega al menos 5 fotos útiles para mejorar conversión y confianza.'
      end,
      case
        when poi_count = 0 then 'Agrega puntos cercanos para mejorar descubrimiento por zona.'
      end,
      case
        when area_expected and (area_m2 is null or area_m2 <= 0) then 'Completa el área del inmueble para hacerlo más comparable.'
      end,
      case
        when utilities_cop_min is null and utilities_cop_max is null and char_length(coalesce(utilities_notes, '')) < 12
          then 'Aclara servicios o costo total estimado para reducir fricción.'
      end,
      case
        when updated_at < now() - interval '30 days' then 'Confirma disponibilidad o actualiza el anuncio para mantenerlo fresco.'
      end
    ],
    null
  ) as improvement_notes,
  updated_at,
  published_at
from score_components;

grant select on public.listing_quality_scores to authenticated;
