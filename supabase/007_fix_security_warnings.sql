-- ============================================
-- Renty — Fix 4 Supabase security warnings
-- Applied: 2026-03-28
-- ============================================
-- Warnings resueltos:
--   1. Extension unaccent en schema public → mover a extensions
--   2. slugify_listing sin search_path fijo
--   3. generate_listing_slug sin search_path fijo
--   4. trigger_set_listing_slug sin search_path fijo
-- ============================================

-- -----------------------------------------------
-- FIX 1: Mover extensión unaccent de public a extensions
-- -----------------------------------------------
drop extension if exists unaccent;
create extension if not exists unaccent schema extensions;

-- -----------------------------------------------
-- FIX 2: Recrear slugify_listing con search_path fijo
--         y referencia explícita a extensions.unaccent
-- -----------------------------------------------
create or replace function public.slugify_listing(value text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select trim(both '-' from regexp_replace(
    regexp_replace(
      lower(extensions.unaccent(coalesce(value, ''))),
      '[^a-z0-9]+',
      '-',
      'g'
    ),
    '-{2,}',
    '-',
    'g'
  ));
$$;

-- -----------------------------------------------
-- FIX 3: Recrear generate_listing_slug con search_path fijo
-- -----------------------------------------------
create or replace function public.generate_listing_slug(
  p_id        uuid,
  p_slug      text,
  p_title     text,
  p_neighborhood text,
  p_city      text,
  p_created_at timestamptz
)
returns text
language plpgsql
set search_path = public
as $$
declare
  v_base text;
  v_candidate text;
  v_counter int := 1;
begin
  v_base := coalesce(
    nullif(public.slugify_listing(p_slug), ''),
    nullif(public.slugify_listing(p_title || ' ' || p_neighborhood || ' ' || p_city), ''),
    'arriendo-en-bogota'
  );

  v_candidate := v_base;

  loop
    if not exists (
      select 1 from public.listings
      where slug = v_candidate
        and id <> p_id
    ) then
      return v_candidate;
    end if;
    v_counter := v_counter + 1;
    v_candidate := v_base || '-' || v_counter;
  end loop;
end;
$$;

-- -----------------------------------------------
-- FIX 4: Recrear trigger_set_listing_slug con search_path fijo
-- -----------------------------------------------
create or replace function public.trigger_set_listing_slug()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (NEW.slug is null or NEW.slug = '')
     or (TG_OP = 'UPDATE' and NEW.title is distinct from OLD.title)
  then
    NEW.slug := public.generate_listing_slug(
      NEW.id, NEW.slug, NEW.title, NEW.neighborhood, NEW.city, NEW.created_at
    );
  end if;
  return NEW;
end;
$$;
