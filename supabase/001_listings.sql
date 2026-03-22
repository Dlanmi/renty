-- ============================================
-- Arriendos Verbenal — Supabase Full Setup
-- Run this ONCE in the Supabase SQL Editor.
-- ============================================

-- ─── 1. Extensions ──────────────────────────
create extension if not exists "pgcrypto";   -- provides gen_random_uuid()

-- ─── 2. Table: public.listings ──────────────
create table public.listings (
  id                 uuid          primary key default gen_random_uuid(),
  status             text          not null default 'active',
  created_at         timestamptz   not null default now(),
  updated_at         timestamptz   not null default now(),

  -- Location
  city               text          not null,
  zone               text,
  neighborhood       text          not null,
  approx_location    text          not null,

  -- Pricing
  price_cop          int           not null,
  billing_period     text          not null default 'month',

  -- Property
  property_type      text          not null,
  bedrooms           int           not null default 0,
  bathrooms          int           not null default 0,
  independent        boolean       not null default false,
  furnished          boolean       not null default false,

  -- Includes & utilities
  includes           text[]        not null default '{}',
  utilities_notes    text,

  -- Requirements
  requirements       text[]        not null default '{}',
  requirements_notes text,

  -- Availability
  available_from     date,
  min_stay_months    int,

  -- Contact
  whatsapp_e164      text          not null,

  -- Content
  title              text          not null,
  description        text,

  -- Media
  cover_photo_url    text          not null
);

-- ─── 3. Indexes ─────────────────────────────
create index idx_listings_status_created on public.listings (status, created_at desc);
create index idx_listings_neighborhood   on public.listings (neighborhood);
create index idx_listings_price          on public.listings (price_cop);

-- ─── 4. Trigger: auto-set updated_at ────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_listings_updated_at
  before update on public.listings
  for each row execute function public.handle_updated_at();

-- ─── 5. RLS ─────────────────────────────────
alter table public.listings enable row level security;

-- Public SELECT for anon + authenticated (read-only)
create policy "Anyone can read listings"
  on public.listings
  for select
  to anon, authenticated
  using (true);

-- No INSERT / UPDATE / DELETE for anon (only authenticated later)
-- (RLS blocks by default when no policy exists for the operation)

-- ─── 6. Storage: bucket listing-images ──────
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "Public read listing images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'listing-images');

-- ─── 7. Seed: 6 listings ────────────────────
insert into public.listings (
  city, zone, neighborhood, approx_location,
  price_cop, billing_period,
  property_type, bedrooms, bathrooms, independent, furnished,
  includes, utilities_notes,
  requirements, requirements_notes,
  available_from, min_stay_months,
  whatsapp_e164,
  title, description,
  cover_photo_url
) values
-- 1 · Verbenal
(
  'Bogotá', 'Norte', 'Verbenal',
  'Cerca al CAI de Verbenal, calle 187',
  850000, 'month',
  'Apartamento', 2, 1, true, false,
  '{agua,luz,gas}', 'Internet no incluido (~$60.000/mes aparte)',
  '{fiador,deposito}', 'Depósito equivalente a 1 mes de arriendo',
  '2026-03-01', 6,
  '573001234567',
  'Apartamento independiente 2 hab – Verbenal',
  'Apartamento independiente con 2 habitaciones y buena iluminación natural. Zona tranquila a una cuadra del transporte público. Cocina semi-integral, piso en cerámica.',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'
),
-- 2 · Verbenal
(
  'Bogotá', 'Norte', 'Verbenal',
  'Frente al parque Verbenal, carrera 17B',
  650000, 'month',
  'Habitación', 1, 1, false, true,
  '{agua,luz,wifi}', 'Todos los servicios incluidos en el canon',
  '{deposito}', 'Depósito de medio mes',
  '2026-03-15', 3,
  '573009876543',
  'Habitación amoblada con WiFi – Verbenal',
  'Habitación privada amoblada en casa familiar. Incluye WiFi, agua y luz. Closet, cama doble, escritorio. Cerca al parque.',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'
),
-- 3 · Toberín
(
  'Bogotá', 'Norte', 'Toberín',
  'A 3 cuadras de la estación Toberín',
  1100000, 'month',
  'Apartamento', 3, 2, true, false,
  '{agua,luz,gas}', 'Servicios aparte, aprox $130.000/mes',
  '{fiador,deposito,carta_laboral}', 'Fiador con propiedad raíz y carta laboral vigente',
  '2026-04-01', 12,
  '573005551234',
  'Apto familiar 3 hab cerca a Toberín',
  'Amplio apartamento de 3 habitaciones, 2 baños, sala-comedor, cocina integral, zona de ropas. Conjunto cerrado con vigilancia 24h.',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'
),
-- 4 · Suba
(
  'Bogotá', 'Noroccidente', 'Suba',
  'Cerca al Portal de Suba, calle 145',
  750000, 'month',
  'Apartaestudio', 1, 1, true, true,
  '{agua,luz,wifi,gas}', 'Administración incluida',
  '{deposito}', 'Un mes de depósito',
  '2026-03-10', 6,
  '573112223344',
  'Apartaestudio amoblado – Suba Portal',
  'Apartaestudio completamente amoblado con cocina tipo americano, baño privado y excelente iluminación. Ideal para persona sola o pareja sin hijos.',
  'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80'
),
-- 5 · Teusaquillo
(
  'Bogotá', 'Centro', 'Teusaquillo',
  'Barrio La Soledad, cerca a la calle 39',
  1400000, 'month',
  'Apartamento', 2, 1, true, true,
  '{agua,luz,gas,wifi,parqueadero}', 'Administración y parqueadero incluidos',
  '{fiador,deposito,referencias}', 'Dos referencias personales y fiador',
  '2026-03-20', 12,
  '573223334455',
  'Apto amoblado en La Soledad – Teusaquillo',
  'Apartamento amoblado de 2 habitaciones en barrio tradicional. Cocina integral, sala amplia, balcón exterior. Cerca a universidades y ciclovía.',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80'
),
-- 6 · Bosa
(
  'Bogotá', 'Sur', 'Bosa',
  'Bosa Centro, a 2 cuadras del CAI',
  520000, 'month',
  'Casa', 2, 1, false, false,
  '{agua,luz}', 'Gas y otros servicios aparte',
  '{deposito}', 'Un mes de depósito, sin fiador',
  '2026-03-05', 3,
  '573334445566',
  'Segundo piso casa familiar – Bosa Centro',
  'Segundo piso independiente con 2 habitaciones, un baño, cocina y patio de ropas. Barrio tranquilo, cerca de comercio y transporte.',
  'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80'
);
