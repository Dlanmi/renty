-- ============================================
-- Arriendos Verbenal — Durable SEO slugs
-- ============================================

create extension if not exists unaccent;

-- 1. Agregar columna slug
alter table public.listings
  add column if not exists slug text;

-- 2. Función de slugify (sin cambios, estaba bien)
create or replace function public.slugify_listing(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    regexp_replace(
      lower(unaccent(coalesce(value, ''))),
      '[^a-z0-9]+',
      '-',
      'g'
    ),
    '-{2,}',
    '-',
    'g'
  ));
$$;

-- 3. Función que genera el slug para UNA fila
--    Usada tanto en el trigger como en el backfill
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
as $$
declare
  v_base text;
  v_candidate text;
  v_counter int := 1;
begin
  -- Prioridad: slug manual > título+barrio+ciudad
  v_base := coalesce(
    nullif(public.slugify_listing(p_slug), ''),
    nullif(public.slugify_listing(p_title || ' ' || p_neighborhood || ' ' || p_city), ''),
    'arriendo-en-bogota'
  );

  v_candidate := v_base;

  -- Buscar unicidad evitando la fila actual
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

-- 4. Trigger que auto-genera slug en INSERT y UPDATE de título
create or replace function public.trigger_set_listing_slug()
returns trigger
language plpgsql
as $$
begin
  -- Solo regenerar si el slug está vacío O si cambió el título
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

drop trigger if exists set_listing_slug on public.listings;
create trigger set_listing_slug
  before insert or update on public.listings
  for each row execute function public.trigger_set_listing_slug();

-- 5. Backfill de inmuebles existentes (solo los que no tienen slug)
update public.listings
set slug = public.generate_listing_slug(
  id, slug, title, neighborhood, city, created_at
)
where slug is null or slug = '';

-- 6. Después del backfill, hacer slug obligatorio
alter table public.listings
  alter column slug set not null;

-- 7. Índices (sin cambios, estaban bien)
create unique index if not exists idx_listings_slug_unique
  on public.listings (slug)
  where slug is not null;

create index if not exists idx_listings_status_slug
  on public.listings (status, slug);