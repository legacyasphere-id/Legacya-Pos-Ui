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
  -- Read the app role from profiles. Do NOT read auth.jwt()->>'role' — in
  -- Supabase that claim is the Postgres role (e.g. 'authenticated'), which
  -- is not a valid app_role value.
  select role from public.profiles where id = auth.uid();
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

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_no_seq start 1001;

create table public."order" (
  id             uuid primary key default gen_random_uuid(),
  order_no       text not null unique default ('ORD-' || lpad(nextval('public.order_no_seq')::text, 4, '0')),
  table_label    text,                                -- minimal table ref (full Table Mgmt is P2)
  customer_type  text not null default 'dine_in' check (customer_type in ('dine_in','takeaway')),
  status         order_status not null default 'pending',
  subtotal       bigint not null default 0,
  discount_id    uuid references public.discount (id),
  discount_type  text not null default 'none' check (discount_type in ('none','percent','amount')),
  discount_value bigint not null default 0,           -- percent in basis points, or IDR amount
  discount_total bigint not null default 0,
  tax_total      bigint not null default 0,
  service_total  bigint not null default 0,
  grand_total    bigint not null default 0,
  placed_by      uuid references public.profiles (id),
  placed_at      timestamptz not null default now(),
  cooking_at     timestamptz,
  ready_at       timestamptz,
  done_at        timestamptz,
  paid_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on public."order" (status);
create index on public."order" (placed_at);

create table public.order_item (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public."order" (id) on delete cascade,
  menu_item_id   uuid not null references public.menu_item (id) on delete restrict,
  name_snapshot  text not null,
  unit_price     bigint not null,                     -- IDR snapshot
  qty            int not null check (qty > 0),
  line_total     bigint not null,
  station_status text not null default 'queued' check (station_status in ('queued','cooking','done')),
  created_at     timestamptz not null default now()
);
create index on public.order_item (order_id);

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------
create table public.payment (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public."order" (id) on delete cascade,
  method          text not null check (method in ('qris','card','cash','ewallet','bank_transfer')),
  amount          bigint not null,                    -- IDR
  status          payment_status not null default 'pending',
  provider        text not null default 'midtrans',
  provider_ref    text,
  idempotency_key text not null unique,
  raw_payload     jsonb,
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index on public.payment (order_id);

-- ---------------------------------------------------------------------------
-- stock_movement (Inventory "History") — single source of truth for stock
-- ---------------------------------------------------------------------------
create table public.stock_movement (
  id            uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredient (id) on delete cascade,
  type          text not null check (type in ('sale','restock','adjust','waste')),
  qty_delta     numeric(12,3) not null,               -- signed; negative = consumption
  reason        text,
  ref_order_id  uuid references public."order" (id) on delete set null,
  created_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now()
);
create index on public.stock_movement (ingredient_id);
create index on public.stock_movement (ref_order_id);

-- Keep ingredient.current_stock in sync with movements.
create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ingredient
     set current_stock     = current_stock + new.qty_delta,
         last_restocked_at  = case when new.type = 'restock' then now() else last_restocked_at end,
         updated_at         = now()
   where id = new.ingredient_id;
  return new;
end;
$$;

create trigger trg_apply_stock_movement
  after insert on public.stock_movement
  for each row execute function public.apply_stock_movement();

-- ---------------------------------------------------------------------------
-- Settings / configuration
-- ---------------------------------------------------------------------------
create table public.store_settings (
  id                serial primary key,
  singleton         boolean not null default true unique check (singleton),  -- enforce one row
  business_name     text,
  handle            text,
  address           text,
  phone             text,
  email             text,
  website           text,
  opens_at          text,
  closes_at         text,
  currency          text not null default 'IDR',
  tax_rate_bps      int not null default 1000,         -- 10.00%
  service_charge_bps int not null default 0,
  logo_url          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.payment_method_config (
  method      text primary key check (method in ('qris','card','cash','ewallet','bank_transfer')),
  is_enabled  boolean not null default true,
  fee_bps     int not null default 0,
  description text,
  updated_at  timestamptz not null default now()
);

create table public.receipt_config (
  id            serial primary key,
  singleton     boolean not null default true unique check (singleton),
  header_line_1 text,
  header_line_2 text,
  footer        text,
  show_logo     boolean not null default true,
  show_tax      boolean not null default true,
  show_qr       boolean not null default false,
  auto_print    boolean not null default false,
  updated_at    timestamptz not null default now()
);

create table public.device (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null check (type in ('printer','terminal')),
  connection  text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.integration (
  id         uuid primary key default gen_random_uuid(),
  provider   text not null,
  status     text not null default 'disconnected',
  config     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- audit_log
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references public.profiles (id),
  action     text not null,
  entity     text not null,
  entity_id  text,
  diff       jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','category','menu_item','ingredient','order',
    'store_settings','receipt_config','integration'
  ] loop
    execute format(
      'create trigger trg_moddatetime_%1$s before update on public.%2$I
         for each row execute function extensions.moddatetime(updated_at);',
      replace(t,'"',''), t);
  end loop;
end;
$$;
