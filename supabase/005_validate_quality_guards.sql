-- ============================================
-- Arriendos Verbenal — Validate Quality Guards
-- Run this ONLY after fixing legacy rows.
-- ============================================

-- Before validating, these counts should be 0:
-- select count(*) from public.listings
-- where listing_kind in ('apartment', 'house', 'studio') and area_m2 is null;
--
-- select count(*) from public.listings
-- where listing_kind in ('room_private', 'room_shared')
--   and (room_bathroom_private is null or kitchen_access is null);
--
-- select count(*) from public.listings
-- where listing_kind = 'room_shared' and cohabitants_count is null;

alter table public.listings validate constraint listings_area_required_by_kind_chk;
alter table public.listings validate constraint listings_room_fields_required_chk;
alter table public.listings validate constraint listings_room_shared_cohabitants_required_chk;
