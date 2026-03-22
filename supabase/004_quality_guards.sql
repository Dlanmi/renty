-- ============================================
-- Arriendos Verbenal — Data Quality Guards
-- Run this AFTER 003_legacy_backfill.sql
-- ============================================

-- Enforce key field consistency by listing_kind to avoid future regressions.

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_area_required_by_kind_chk'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_area_required_by_kind_chk
      check (
        listing_kind not in ('apartment', 'house', 'studio')
        or area_m2 is not null
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_room_fields_required_chk'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_room_fields_required_chk
      check (
        listing_kind not in ('room_private', 'room_shared')
        or (room_bathroom_private is not null and kitchen_access is not null)
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_room_shared_cohabitants_required_chk'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_room_shared_cohabitants_required_chk
      check (
        listing_kind <> 'room_shared'
        or cohabitants_count is not null
      ) not valid;
  end if;
end;
$$;
