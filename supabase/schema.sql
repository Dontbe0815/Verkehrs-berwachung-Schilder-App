-- ==========================================
-- VZ-Map Pro v3 Schema (Auth + Approval + RLS)
-- ==========================================

create extension if not exists "uuid-ossp";

-- Admin whitelist: pre-fill with allowed admin emails
create table if not exists public.admin_whitelist (
  email text primary key,
  created_at timestamptz not null default now()
);

-- Profiles for approval / roles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text null,
  role text not null default 'user' check (role in ('admin','user')),
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Locations
create table if not exists public.locations (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  street_name text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_verified_at date null,
  status text not null default 'needs_review' check (status in ('active','outdated','needs_review'))
);

-- Signs
create table if not exists public.signs (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  main_sign_code text not null,
  main_sign_label text not null,
  direction text not null default 'both' check (direction in ('both','left','right','start','end')),
  validity_text text null,
  additional_signs jsonb not null default '[]'::jsonb,
  notes text null,
  confidence_level text not null default 'probable' check (confidence_level in ('confirmed','probable','unclear')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Photos
create table if not exists public.photos (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  sign_id uuid not null references public.signs(id) on delete cascade,
  image_path text not null,
  type text not null default 'closeup' check (type in ('closeup','overview')),
  uploaded_at timestamptz not null default now()
);

-- Zones
create table if not exists public.zones (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text null,
  geo_polygon jsonb not null,
  special_rules text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_locations_owner on public.locations(owner_id);
create index if not exists idx_signs_owner on public.signs(owner_id);
create index if not exists idx_signs_location on public.signs(location_id);
create index if not exists idx_photos_owner on public.photos(owner_id);
create index if not exists idx_zones_owner on public.zones(owner_id);

-- ======================
-- Helper functions (RLS)
-- ======================

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.admin_whitelist aw
    where lower(aw.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.is_approved()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.approved = true
  );
$$;

-- ======================
-- RLS enable
-- ======================

alter table public.admin_whitelist enable row level security;
alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.signs enable row level security;
alter table public.photos enable row level security;
alter table public.zones enable row level security;

-- ======================
-- admin_whitelist policies
-- Only admins can read/modify whitelist (bootstrap: insert via SQL editor)
-- ======================
drop policy if exists "aw_admin_select" on public.admin_whitelist;
create policy "aw_admin_select"
on public.admin_whitelist for select
to authenticated
using (public.is_admin());

drop policy if exists "aw_admin_modify" on public.admin_whitelist;
create policy "aw_admin_modify"
on public.admin_whitelist for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ======================
-- profiles policies
-- ======================

-- Users can select their own profile
drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
on public.profiles for select
to authenticated
using (id = auth.uid());

-- Users can insert their own profile (pending by default)
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

-- Users can update their own display_name only (app enforces; RLS permits self update)
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Admins can select/update all profiles (approve users, set roles)
drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select"
on public.profiles for select
to authenticated
using (public.is_admin());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ======================
-- Data tables policies: only approved users
-- Admins see everything; users see their own rows
-- ======================

-- LOCATIONS
drop policy if exists "loc_select" on public.locations;
create policy "loc_select"
on public.locations for select
to authenticated
using (public.is_admin() or (public.is_approved() and owner_id = auth.uid()));

drop policy if exists "loc_insert" on public.locations;
create policy "loc_insert"
on public.locations for insert
to authenticated
with check ((public.is_admin() or public.is_approved()) and owner_id = auth.uid());

drop policy if exists "loc_update" on public.locations;
create policy "loc_update"
on public.locations for update
to authenticated
using ((public.is_admin() or public.is_approved()) and owner_id = auth.uid())
with check ((public.is_admin() or public.is_approved()) and owner_id = auth.uid());

drop policy if exists "loc_delete" on public.locations;
create policy "loc_delete"
on public.locations for delete
to authenticated
using ((public.is_admin() or public.is_approved()) and owner_id = auth.uid());

-- SIGNS
drop policy if exists "sign_select" on public.signs;
create policy "sign_select"
on public.signs for select
to authenticated
using (public.is_admin() or (public.is_approved() and owner_id = auth.uid()));

drop policy if exists "sign_insert" on public.signs;
create policy "sign_insert"
on public.signs for insert
to authenticated
with check ((public.is_admin() or public.is_approved()) and owner_id = auth.uid());

drop policy if exists "sign_update" on public.signs;
create policy "sign_update"
on public.signs for update
to authenticated
using ((public.is_admin() or public.is_approved()) and owner_id = auth.uid())
with check ((public.is_admin() or public.is_approved()) and owner_id = auth.uid());

drop policy if exists "sign_delete" on public.signs;
create policy "sign_delete"
on public.signs for delete
to authenticated
using ((public.is_admin() or public.is_approved()) and owner_id = auth.uid());

-- PHOTOS
drop policy if exists "photo_select" on public.photos;
create policy "photo_select"
on public.photos for select
to authenticated
using (public.is_admin() or (public.is_approved() and owner_id = auth.uid()));

drop policy if exists "photo_insert" on public.photos;
create policy "photo_insert"
on public.photos for insert
to authenticated
with check ((public.is_admin() or public.is_approved()) and owner_id = auth.uid());

drop policy if exists "photo_delete" on public.photos;
create policy "photo_delete"
on public.photos for delete
to authenticated
using ((public.is_admin() or public.is_approved()) and owner_id = auth.uid());

-- ZONES
drop policy if exists "zone_select" on public.zones;
create policy "zone_select"
on public.zones for select
to authenticated
using (public.is_admin() or (public.is_approved() and owner_id = auth.uid()));

drop policy if exists "zone_insert" on public.zones;
create policy "zone_insert"
on public.zones for insert
to authenticated
with check ((public.is_admin() or public.is_approved()) and owner_id = auth.uid());

drop policy if exists "zone_update" on public.zones;
create policy "zone_update"
on public.zones for update
to authenticated
using ((public.is_admin() or public.is_approved()) and owner_id = auth.uid())
with check ((public.is_admin() or public.is_approved()) and owner_id = auth.uid());

drop policy if exists "zone_delete" on public.zones;
create policy "zone_delete"
on public.zones for delete
to authenticated
using ((public.is_admin() or public.is_approved()) and owner_id = auth.uid());

-- ======================
-- IMPORTANT: Bootstrap admin
-- ======================
-- 1) Insert your admin email into admin_whitelist using SQL editor:
-- insert into public.admin_whitelist(email) values ('DEINADMIN@MAIL.DE');
--
-- 2) First login with this email, then open /admin to approve users.
