-- ============================================
-- Arriendos Verbenal — Legacy Data Backfill
-- Run this AFTER 002_admin_foundation.sql
-- ============================================

begin;

-- 1) Normalize listing_kind again for old rows (idempotent).
update public.listings
set listing_kind = case
  when lower(property_type) like '%habit%' then 'room_private'
  when lower(property_type) like '%casa%' then 'house'
  when lower(property_type) like '%apartaestudio%' then 'studio'
  when lower(property_type) like '%studio%' then 'studio'
  when lower(property_type) like '%apart%' then 'apartment'
  else listing_kind
end
where listing_kind is null
   or listing_kind not in ('apartment', 'house', 'studio', 'room_private', 'room_shared');

-- 2) Backfill room-specific fields only where missing (legacy-safe).
update public.listings
set room_bathroom_private = false
where listing_kind in ('room_private', 'room_shared')
  and room_bathroom_private is null;

update public.listings
set kitchen_access = false
where listing_kind in ('room_private', 'room_shared')
  and kitchen_access is null;

update public.listings
set cohabitants_count = 1
where listing_kind = 'room_shared'
  and cohabitants_count is null;

-- 3) Keep non-room rows clean in room-specific fields.
update public.listings
set room_bathroom_private = null,
    kitchen_access = null,
    cohabitants_count = null
where listing_kind not in ('room_private', 'room_shared')
  and (
    room_bathroom_private is not null
    or kitchen_access is not null
    or cohabitants_count is not null
  );

-- 4) Ensure active/rented timestamps are populated for older rows.
update public.listings
set published_at = coalesce(published_at, created_at)
where status = 'active'
  and published_at is null;

update public.listings
set rented_at = coalesce(rented_at, updated_at, created_at)
where status = 'rented'
  and rented_at is null;

commit;

-- Optional sanity checks after running:
-- select listing_kind, count(*) from public.listings group by listing_kind order by listing_kind;
-- select count(*) as room_missing_fields from public.listings
-- where listing_kind in ('room_private','room_shared')
--   and (room_bathroom_private is null or kitchen_access is null);
-- select count(*) as room_shared_missing_cohabitants from public.listings
-- where listing_kind = 'room_shared' and cohabitants_count is null;
