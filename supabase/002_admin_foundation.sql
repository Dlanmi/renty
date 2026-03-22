-- ============================================
-- Arriendos Verbenal — Admin Foundation (Phase P0)
-- Run this AFTER 001_listings.sql in Supabase SQL Editor.
-- ============================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------
-- 1) Profiles + admin role helpers
-- -------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'editor',
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_chk check (role in ('admin', 'editor'))
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_profiles_updated_at'
      and tgrelid = 'public.profiles'::regclass
  ) then
    create trigger trg_profiles_updated_at
      before update on public.profiles
      for each row execute function public.handle_updated_at();
  end if;
end;
$$;

create or replace function public.is_admin_or_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'editor')
  );
$$;

revoke all on function public.is_admin_or_editor() from public;
grant execute on function public.is_admin_or_editor() to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "Profiles read own" on public.profiles;
create policy "Profiles read own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "Profiles admin all" on public.profiles;
create policy "Profiles admin all"
  on public.profiles
  for all
  to authenticated
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

-- -------------------------------------------------------------------
-- 2) listings: richer attributes + status discipline
-- -------------------------------------------------------------------
alter table public.listings
  add column if not exists listing_kind text not null default 'apartment',
  add column if not exists residential_context text not null default 'barrio',
  add column if not exists residential_name text,
  add column if not exists area_m2 numeric(8,2),
  add column if not exists admin_fee_cop int not null default 0,
  add column if not exists utilities_cop_min int,
  add column if not exists utilities_cop_max int,
  add column if not exists parking_car_count int not null default 0,
  add column if not exists parking_motorcycle_count int not null default 0,
  add column if not exists pets_allowed boolean,
  add column if not exists floor_number int,
  add column if not exists has_elevator boolean,
  add column if not exists published_at timestamptz,
  add column if not exists rented_at timestamptz,
  add column if not exists room_bathroom_private boolean,
  add column if not exists kitchen_access boolean,
  add column if not exists cohabitants_count int;

-- Normalize legacy statuses before applying strict status constraint.
update public.listings
set status = case
  when lower(trim(status)) in ('active', 'draft', 'pending_review', 'rented', 'inactive', 'rejected')
    then lower(trim(status))
  when lower(trim(status)) in ('arrendado', 'rented_out', 'leased')
    then 'rented'
  when lower(trim(status)) in ('inactivo', 'inactive', 'disabled', 'deactivated', 'archived')
    then 'inactive'
  when lower(trim(status)) in ('pending', 'review', 'pendingreview')
    then 'pending_review'
  else 'draft'
end;

update public.listings
set listing_kind = case
  when lower(property_type) like '%habit%' then 'room_private'
  when lower(property_type) like '%casa%' then 'house'
  when lower(property_type) like '%apartaestudio%' then 'studio'
  when lower(property_type) like '%studio%' then 'studio'
  when lower(property_type) like '%apart%' then 'apartment'
  else listing_kind
end;

update public.listings
set published_at = coalesce(published_at, created_at)
where status = 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_status_v2_chk'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_status_v2_chk
      check (status in ('draft', 'pending_review', 'active', 'rented', 'inactive', 'rejected'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_kind_chk'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_kind_chk
      check (listing_kind in ('apartment', 'house', 'studio', 'room_private', 'room_shared'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_residential_context_chk'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_residential_context_chk
      check (residential_context in ('barrio', 'conjunto', 'edificio', 'casa_familiar'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_area_m2_chk'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_area_m2_chk
      check (area_m2 is null or area_m2 > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_admin_fee_cop_chk'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_admin_fee_cop_chk
      check (admin_fee_cop >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_utilities_cop_min_chk'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_utilities_cop_min_chk
      check (utilities_cop_min is null or utilities_cop_min >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_utilities_cop_max_chk'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_utilities_cop_max_chk
      check (utilities_cop_max is null or utilities_cop_max >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_utilities_range_chk'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_utilities_range_chk
      check (
        utilities_cop_min is null
        or utilities_cop_max is null
        or utilities_cop_min <= utilities_cop_max
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_parking_car_count_chk'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_parking_car_count_chk
      check (parking_car_count >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_parking_motorcycle_count_chk'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_parking_motorcycle_count_chk
      check (parking_motorcycle_count >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'listings_cohabitants_count_chk'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_cohabitants_count_chk
      check (cohabitants_count is null or cohabitants_count >= 0);
  end if;
end;
$$;

create index if not exists idx_listings_status_updated
  on public.listings (status, updated_at desc);
create index if not exists idx_listings_kind_status
  on public.listings (listing_kind, status, created_at desc);
create index if not exists idx_listings_neighborhood_status
  on public.listings (neighborhood, status);
create index if not exists idx_listings_price_status
  on public.listings (price_cop, status);

create or replace function public.handle_listing_status_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from 'active') then
    new.published_at = coalesce(new.published_at, now());
  end if;

  if new.status = 'rented' and (tg_op = 'INSERT' or old.status is distinct from 'rented') then
    new.rented_at = coalesce(new.rented_at, now());
  elsif tg_op = 'UPDATE' and old.status = 'rented' and new.status <> 'rented' then
    new.rented_at = null;
  end if;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_listings_status_timestamps'
      and tgrelid = 'public.listings'::regclass
  ) then
    create trigger trg_listings_status_timestamps
      before insert or update on public.listings
      for each row execute function public.handle_listing_status_timestamps();
  end if;
end;
$$;

drop policy if exists "Anyone can read listings" on public.listings;
drop policy if exists "Public can read active listings" on public.listings;
create policy "Public can read active listings"
  on public.listings
  for select
  to anon, authenticated
  using (status = 'active');

drop policy if exists "Admins can read all listings" on public.listings;
create policy "Admins can read all listings"
  on public.listings
  for select
  to authenticated
  using (public.is_admin_or_editor());

drop policy if exists "Admins can insert listings" on public.listings;
create policy "Admins can insert listings"
  on public.listings
  for insert
  to authenticated
  with check (public.is_admin_or_editor());

drop policy if exists "Admins can update listings" on public.listings;
create policy "Admins can update listings"
  on public.listings
  for update
  to authenticated
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

drop policy if exists "Admins can delete listings" on public.listings;
create policy "Admins can delete listings"
  on public.listings
  for delete
  to authenticated
  using (public.is_admin_or_editor());

-- -------------------------------------------------------------------
-- 3) listing_photos: multiple images per listing
-- -------------------------------------------------------------------
create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  caption text,
  room_type text,
  sort_order int not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_photos_sort_order_chk check (sort_order >= 0),
  constraint listing_photos_room_type_chk check (
    room_type is null or room_type in (
      'facade',
      'living_room',
      'kitchen',
      'bedroom',
      'bathroom',
      'laundry',
      'common_area',
      'other'
    )
  )
);

create unique index if not exists ux_listing_photos_cover_per_listing
  on public.listing_photos (listing_id)
  where is_cover = true;

create index if not exists idx_listing_photos_listing_sort
  on public.listing_photos (listing_id, sort_order, created_at);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_listing_photos_updated_at'
      and tgrelid = 'public.listing_photos'::regclass
  ) then
    create trigger trg_listing_photos_updated_at
      before update on public.listing_photos
      for each row execute function public.handle_updated_at();
  end if;
end;
$$;

alter table public.listing_photos enable row level security;

drop policy if exists "Public can read photos of active listings" on public.listing_photos;
create policy "Public can read photos of active listings"
  on public.listing_photos
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and l.status = 'active'
    )
  );

drop policy if exists "Admins can read all listing photos" on public.listing_photos;
create policy "Admins can read all listing photos"
  on public.listing_photos
  for select
  to authenticated
  using (public.is_admin_or_editor());

drop policy if exists "Admins can insert listing photos" on public.listing_photos;
create policy "Admins can insert listing photos"
  on public.listing_photos
  for insert
  to authenticated
  with check (public.is_admin_or_editor());

drop policy if exists "Admins can update listing photos" on public.listing_photos;
create policy "Admins can update listing photos"
  on public.listing_photos
  for update
  to authenticated
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

drop policy if exists "Admins can delete listing photos" on public.listing_photos;
create policy "Admins can delete listing photos"
  on public.listing_photos
  for delete
  to authenticated
  using (public.is_admin_or_editor());

-- -------------------------------------------------------------------
-- 4) listing_pois: nearby points of interest
-- -------------------------------------------------------------------
create table if not exists public.listing_pois (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  kind text not null,
  name text not null,
  distance_m int,
  walk_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_pois_kind_chk check (
    kind in ('park', 'transport', 'supermarket', 'pharmacy', 'school', 'hospital', 'other')
  ),
  constraint listing_pois_distance_m_chk check (distance_m is null or distance_m >= 0),
  constraint listing_pois_walk_minutes_chk check (walk_minutes is null or walk_minutes >= 0)
);

create index if not exists idx_listing_pois_listing_kind
  on public.listing_pois (listing_id, kind, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_listing_pois_updated_at'
      and tgrelid = 'public.listing_pois'::regclass
  ) then
    create trigger trg_listing_pois_updated_at
      before update on public.listing_pois
      for each row execute function public.handle_updated_at();
  end if;
end;
$$;

alter table public.listing_pois enable row level security;

drop policy if exists "Public can read POIs of active listings" on public.listing_pois;
create policy "Public can read POIs of active listings"
  on public.listing_pois
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and l.status = 'active'
    )
  );

drop policy if exists "Admins can read all POIs" on public.listing_pois;
create policy "Admins can read all POIs"
  on public.listing_pois
  for select
  to authenticated
  using (public.is_admin_or_editor());

drop policy if exists "Admins can insert POIs" on public.listing_pois;
create policy "Admins can insert POIs"
  on public.listing_pois
  for insert
  to authenticated
  with check (public.is_admin_or_editor());

drop policy if exists "Admins can update POIs" on public.listing_pois;
create policy "Admins can update POIs"
  on public.listing_pois
  for update
  to authenticated
  using (public.is_admin_or_editor())
  with check (public.is_admin_or_editor());

drop policy if exists "Admins can delete POIs" on public.listing_pois;
create policy "Admins can delete POIs"
  on public.listing_pois
  for delete
  to authenticated
  using (public.is_admin_or_editor());

-- -------------------------------------------------------------------
-- 5) listing_audit_logs: track admin actions
-- -------------------------------------------------------------------
create table if not exists public.listing_audit_logs (
  id bigserial primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint listing_audit_logs_action_chk check (
    action in (
      'create',
      'update',
      'status_change',
      'activate',
      'deactivate',
      'mark_rented',
      'photo_add',
      'photo_remove',
      'photo_reorder'
    )
  )
);

create index if not exists idx_listing_audit_logs_listing_created
  on public.listing_audit_logs (listing_id, created_at desc);
create index if not exists idx_listing_audit_logs_actor_created
  on public.listing_audit_logs (actor_user_id, created_at desc);

alter table public.listing_audit_logs enable row level security;

drop policy if exists "Admins can read audit logs" on public.listing_audit_logs;
create policy "Admins can read audit logs"
  on public.listing_audit_logs
  for select
  to authenticated
  using (public.is_admin_or_editor());

drop policy if exists "Admins can insert audit logs" on public.listing_audit_logs;
create policy "Admins can insert audit logs"
  on public.listing_audit_logs
  for insert
  to authenticated
  with check (public.is_admin_or_editor());

-- -------------------------------------------------------------------
-- 6) Storage policies for admin write access
-- -------------------------------------------------------------------
drop policy if exists "Admins can upload listing images" on storage.objects;
create policy "Admins can upload listing images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and public.is_admin_or_editor()
  );

drop policy if exists "Admins can update listing images" on storage.objects;
create policy "Admins can update listing images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'listing-images'
    and public.is_admin_or_editor()
  )
  with check (
    bucket_id = 'listing-images'
    and public.is_admin_or_editor()
  );

drop policy if exists "Admins can delete listing images" on storage.objects;
create policy "Admins can delete listing images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and public.is_admin_or_editor()
  );

-- -------------------------------------------------------------------
-- 7) Bootstrap note
-- -------------------------------------------------------------------
-- After creating your first auth user, run this once (replace UUID):
-- insert into public.profiles (id, role, full_name)
-- values ('YOUR_AUTH_USER_UUID', 'admin', 'Tu nombre')
-- on conflict (id) do update set role = excluded.role, full_name = excluded.full_name;
