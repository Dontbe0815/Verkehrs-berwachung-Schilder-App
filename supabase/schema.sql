-- Run this in Supabase SQL Editor.
-- Creates tables to store locations, signs, zones + app settings.
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  lat double precision not null,
  lng double precision not null,
  street text null,
  status text not null default 'needs_review',
  last_verified date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.signs (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  main_code text not null,
  main_label text not null,
  direction text not null default 'both',
  validity text null,
  additional jsonb not null default '[]'::jsonb,
  notes text null,
  confidence text not null default 'probable',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text null,
  rules text null,
  geojson jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- v2: mobile/temporary signage
alter table public.signs add column if not exists is_temporary boolean not null default false;
alter table public.signs add column if not exists expires_at date null;
alter table public.signs add column if not exists state text not null default 'active'; -- active | expired

-- App settings (single row id=1)
create table if not exists public.app_settings (
  id int primary key,
  default_city text not null,
  default_lat double precision not null,
  default_lng double precision not null,
  default_zoom int not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, default_city, default_lat, default_lng, default_zoom)
values (1, 'Duisburg', 51.4344, 6.7623, 12)
on conflict (id) do nothing;

create index if not exists signs_location_id_idx on public.signs(location_id);
