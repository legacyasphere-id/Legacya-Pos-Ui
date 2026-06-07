-- ===== CHUNK 1 of 7 — run first. Clears any partial paste (safe on a fresh project). =====
-- Targeted drops (NOT "drop schema public" — that needs a schema-wide exclusive
-- lock that Supabase's live API connections block, causing a hang).
drop table if exists public.audit_log            cascade;
drop table if exists public.stock_movement       cascade;
drop table if exists public.payment              cascade;
drop table if exists public.order_item           cascade;
drop table if exists public."order"              cascade;
drop table if exists public.recipe_item          cascade;
drop table if exists public.menu_item            cascade;
drop table if exists public.category             cascade;
drop table if exists public.ingredient           cascade;
drop table if exists public.discount             cascade;
drop table if exists public.device               cascade;
drop table if exists public.integration          cascade;
drop table if exists public.receipt_config       cascade;
drop table if exists public.payment_method_config cascade;
drop table if exists public.store_settings       cascade;
drop table if exists public.profiles             cascade;
drop function if exists public.handle_new_user()        cascade;
drop function if exists public.apply_stock_movement()   cascade;
drop function if exists public.auth_role()              cascade;
drop sequence if exists public.order_no_seq      cascade;
drop type if exists order_status   cascade;
drop type if exists payment_status cascade;
drop type if exists app_role       cascade;

-- ============================================================================
-- LegacyaPOS — P1 schema (init)
-- Single-location. Money in integer Rupiah (IDR). Timestamps in UTC (timestamptz);
-- convert to Asia/Jakarta at query time. No branch scoping (see docs §1).
-- ============================================================================

create extension if not exists pgcrypto;            -- gen_random_uuid()
create extension if not exists moddatetime schema extensions;  -- updated_at trigger

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type app_role      as enum ('owner', 'manager', 'cashier', 'kitchen');
create type order_status  as enum ('pending', 'cooking', 'ready', 'done', 'paid', 'void');
create type payment_status as enum ('pending', 'settled', 'failed', 'refunded', 'expired');

-- ---------------------------------------------------------------------------
-- profiles (Staff / Team) — mirrors auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text unique,
  phone       text,
  role        app_role not null default 'cashier',
  avatar_url  text,
  status      text not null default 'active' check (status in ('active','invited','disabled')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role helper: read role from JWT claim, fall back to profiles.
create or replace function public.auth_role()
returns app_role
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'role', '')::app_role,
    (select role from public.profiles where id = auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Catalog: category, menu_item
-- ---------------------------------------------------------------------------
create table public.category (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.menu_item (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.category (id) on delete restrict,
  name         text not null,
  price        bigint not null check (price >= 0),   -- IDR
  emoji        text,
  image_url    text,
  is_available boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on public.menu_item (category_id);

-- ---------------------------------------------------------------------------
-- Inventory: ingredient, recipe_item (BOM), stock_movement
-- ---------------------------------------------------------------------------
create table public.ingredient (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  category          text,
  unit              text not null,                    -- pcs | kg | g | L ...
  current_stock     numeric(12,3) not null default 0,
  min_stock         numeric(12,3) not null default 0,
  last_restocked_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.recipe_item (
  id            uuid primary key default gen_random_uuid(),
  menu_item_id  uuid not null references public.menu_item (id) on delete cascade,
  ingredient_id uuid not null references public.ingredient (id) on delete restrict,
  qty_per_unit  numeric(12,3) not null check (qty_per_unit > 0),
  unique (menu_item_id, ingredient_id)
);

-- ---------------------------------------------------------------------------
-- discount (rules behind the Cashier discount selector)
-- ---------------------------------------------------------------------------
create table public.discount (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  kind       text not null check (kind in ('percent','amount')),
  value      bigint not null,                          -- percent in basis points, or IDR
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

