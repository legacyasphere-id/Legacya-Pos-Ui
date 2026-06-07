-- ============================================================================
-- LegacyaPOS — P1 one-shot setup (run once in Supabase SQL Editor)
-- = migrations 0001 + 0002 + 0003 + seed, concatenated in order.
-- Safe to run on a fresh Supabase project (auth schema/roles already exist).
-- ============================================================================

-- ////////// 0001 init //////////
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

-- ////////// 0002 rls //////////
-- ============================================================================
-- LegacyaPOS — P1 RLS (Step 1: development baseline)
-- Enable RLS everywhere. Authenticated users are broadly allowed so feature
-- work isn't blocked; anon has no access. payment / stock_movement / audit_log
-- are READ-ONLY for authenticated — writes happen only through the
-- security-definer RPCs (which bypass RLS). Tighten to the per-role matrix
-- (docs §4) before production.
-- ============================================================================

-- Schema + privilege grants (RLS still gates rows).
grant usage on schema public to anon, authenticated;
grant all on all tables    in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

-- Tables that authenticated users may fully read/write in dev.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','category','menu_item','ingredient','recipe_item','discount',
    'order','order_item','store_settings','payment_method_config',
    'receipt_config','device','integration'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy dev_authenticated_all on public.%I
         for all to authenticated using (true) with check (true);', t);
  end loop;
end;
$$;

-- Read-only tables: select for authenticated, writes only via definer RPCs.
do $$
declare t text;
begin
  foreach t in array array['payment','stock_movement','audit_log'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy dev_authenticated_read on public.%I
         for select to authenticated using (true);', t);
  end loop;
end;
$$;

-- ////////// 0003 functions //////////
-- ============================================================================
-- LegacyaPOS — P1 server logic (Postgres RPC)
-- All functions are SECURITY DEFINER (bypass RLS) and validate the caller's
-- role via auth_role(). Money math is integer IDR; percentages are basis
-- points (10000 = 100%). Edge Functions (Midtrans) live in supabase/functions.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- place_order(payload jsonb) -> order
-- payload: { table_label, customer_type, discount_id?, items:[{menu_item_id, qty}] }
-- ---------------------------------------------------------------------------
create or replace function public.place_order(payload jsonb)
returns public."order"
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_order          public."order";
  v_item           jsonb;
  v_menu           public.menu_item;
  v_subtotal       bigint := 0;
  v_disc           public.discount;
  v_discount_type  text := 'none';
  v_discount_value bigint := 0;
  v_discount_total bigint := 0;
  v_tax_bps        int := 0;
  v_service_bps    int := 0;
  v_taxable        bigint;
begin
  if public.auth_role() not in ('cashier','manager','owner') then
    raise exception 'not authorized to place orders';
  end if;

  insert into public."order" (table_label, customer_type, status, placed_by)
  values (payload->>'table_label',
          coalesce(payload->>'customer_type','dine_in'),
          'pending', auth.uid())
  returning * into v_order;

  for v_item in select value from jsonb_array_elements(payload->'items') loop
    select * into v_menu from public.menu_item where id = (v_item->>'menu_item_id')::uuid;
    if not found then
      raise exception 'menu_item % not found', v_item->>'menu_item_id';
    end if;
    insert into public.order_item (order_id, menu_item_id, name_snapshot, unit_price, qty, line_total)
    values (v_order.id, v_menu.id, v_menu.name, v_menu.price,
            (v_item->>'qty')::int, v_menu.price * (v_item->>'qty')::int);
    v_subtotal := v_subtotal + v_menu.price * (v_item->>'qty')::int;
  end loop;

  if (payload ->> 'discount_id') is not null and (payload ->> 'discount_id') <> '' then
    select * into v_disc
      from public.discount
     where id = (payload->>'discount_id')::uuid and is_active;
    if found then
      v_discount_type  := v_disc.kind;
      v_discount_value := v_disc.value;
      v_discount_total := case when v_disc.kind = 'percent'
                               then (v_subtotal * v_disc.value) / 10000
                               else least(v_disc.value, v_subtotal) end;
    end if;
  end if;

  select tax_rate_bps, service_charge_bps
    into v_tax_bps, v_service_bps
    from public.store_settings where singleton;
  v_tax_bps     := coalesce(v_tax_bps, 0);
  v_service_bps := coalesce(v_service_bps, 0);
  v_taxable     := v_subtotal - v_discount_total;

  update public."order"
     set subtotal       = v_subtotal,
         discount_id    = nullif(payload->>'discount_id','')::uuid,
         discount_type  = v_discount_type,
         discount_value = v_discount_value,
         discount_total = v_discount_total,
         tax_total      = (v_taxable * v_tax_bps) / 10000,
         service_total  = (v_taxable * v_service_bps) / 10000,
         grand_total    = v_taxable
                          + (v_taxable * v_tax_bps) / 10000
                          + (v_taxable * v_service_bps) / 10000
   where id = v_order.id
   returning * into v_order;

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- advance_order_status(order_id, to_status) -> order
-- Role-gated; kitchen may only set cooking/ready/done. (Strict forward-only
-- state-machine validation can be layered on later.)
-- ---------------------------------------------------------------------------
create or replace function public.advance_order_status(p_order_id uuid, p_to order_status)
returns public."order"
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_order public."order";
  v_role  app_role := public.auth_role();
begin
  if v_role not in ('owner','manager','cashier','kitchen') then
    raise exception 'not authorized';
  end if;
  if v_role = 'kitchen' and p_to not in ('cooking','ready','done') then
    raise exception 'kitchen may only set cooking/ready/done';
  end if;

  update public."order"
     set status     = p_to,
         cooking_at = case when p_to = 'cooking' then now() else cooking_at end,
         ready_at   = case when p_to = 'ready'   then now() else ready_at end,
         done_at    = case when p_to = 'done'    then now() else done_at end,
         paid_at    = case when p_to = 'paid'    then now() else paid_at end
   where id = p_order_id
   returning * into v_order;

  if not found then raise exception 'order % not found', p_order_id; end if;
  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- consume_stock_for_order(order_id) — expand BOM, write negative movements.
-- Idempotent: skips if 'sale' movements already exist for the order.
-- ---------------------------------------------------------------------------
create or replace function public.consume_stock_for_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if exists (select 1 from public.stock_movement
              where ref_order_id = p_order_id and type = 'sale') then
    return;
  end if;

  insert into public.stock_movement (ingredient_id, type, qty_delta, reason, ref_order_id, created_by)
  select ri.ingredient_id, 'sale', -(ri.qty_per_unit * oi.qty), 'order sale', p_order_id, auth.uid()
    from public.order_item oi
    join public.recipe_item ri on ri.menu_item_id = oi.menu_item_id
   where oi.order_id = p_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- adjust_stock(ingredient_id, qty_delta, type, reason) -> stock_movement
-- ---------------------------------------------------------------------------
create or replace function public.adjust_stock(
  p_ingredient_id uuid, p_qty_delta numeric, p_type text, p_reason text default null)
returns public.stock_movement
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_mv public.stock_movement;
begin
  if public.auth_role() not in ('owner','manager') then
    raise exception 'not authorized to adjust stock';
  end if;
  if p_type not in ('restock','adjust','waste') then
    raise exception 'invalid movement type %', p_type;
  end if;
  insert into public.stock_movement (ingredient_id, type, qty_delta, reason, created_by)
  values (p_ingredient_id, p_type, p_qty_delta, p_reason, auth.uid())
  returning * into v_mv;
  return v_mv;
end;
$$;

-- ---------------------------------------------------------------------------
-- pay_order_cash(order_id, amount, idempotency_key) -> payment
-- Idempotent on idempotency_key; marks order paid and consumes stock.
-- ---------------------------------------------------------------------------
create or replace function public.pay_order_cash(
  p_order_id uuid, p_amount bigint, p_idempotency_key text)
returns public.payment
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_pay public.payment;
begin
  if public.auth_role() not in ('cashier','manager','owner') then
    raise exception 'not authorized to take payment';
  end if;

  select * into v_pay from public.payment where idempotency_key = p_idempotency_key;
  if found then return v_pay; end if;

  insert into public.payment (order_id, method, amount, status, provider, idempotency_key, paid_at)
  values (p_order_id, 'cash', p_amount, 'settled', 'cash', p_idempotency_key, now())
  returning * into v_pay;

  update public."order" set status = 'paid', paid_at = now() where id = p_order_id;
  perform public.consume_stock_for_order(p_order_id);

  return v_pay;
end;
$$;

-- Expose RPCs to authenticated callers (role checks happen inside).
grant execute on function
  public.place_order(jsonb),
  public.advance_order_status(uuid, order_status),
  public.consume_stock_for_order(uuid),
  public.adjust_stock(uuid, numeric, text, text),
  public.pay_order_cash(uuid, bigint, text)
to authenticated;

-- ////////// seed //////////
-- ============================================================================
-- LegacyaPOS — seed data (derived from the frontend mock arrays)
-- Catalog + settings + a few demo orders so analytics views aren't empty.
-- Staff/profiles are created by real sign-ups (see supabase/README.md), not here.
-- ============================================================================

-- Settings ------------------------------------------------------------------
insert into public.store_settings (singleton, business_name, handle, address, phone, email, website, opens_at, closes_at, currency, tax_rate_bps, service_charge_bps)
values (true, 'Legacya Kitchen', '@legacya', 'Jl. Kemang Raya No. 1, Jakarta', '+62 811 0000', 'hello@legacya.co', 'legacya.co', '10:00', '22:00', 'IDR', 1000, 0)
on conflict (singleton) do nothing;

insert into public.receipt_config (singleton, header_line_1, header_line_2, footer, show_logo, show_tax, show_qr, auto_print)
values (true, 'Legacya Kitchen', 'Cabang Kemang', 'Thank you! See you again 🍜', true, true, false, false)
on conflict (singleton) do nothing;

insert into public.payment_method_config (method, is_enabled, fee_bps, description) values
  ('qris',          true,  70, 'All Indonesian e-wallet & bank QR'),
  ('card',          true, 250, 'Visa, Mastercard, JCB via card terminal'),
  ('cash',          true,   0, 'Physical cash with change calculator'),
  ('ewallet',       true, 150, 'GoPay, OVO, DANA direct integration'),
  ('bank_transfer', false,  0, 'Manual transfer verification')
on conflict (method) do nothing;

-- Discounts -----------------------------------------------------------------
insert into public.discount (label, kind, value) values
  ('10%', 'percent', 1000),
  ('15%', 'percent', 1500);

-- Categories ----------------------------------------------------------------
insert into public.category (name, sort_order) values
  ('Rice Bowl', 1), ('Sushi', 2), ('Mains', 3), ('Beverages', 4);

-- Menu items ----------------------------------------------------------------
insert into public.menu_item (category_id, name, price, emoji)
select c.id, m.name, m.price, m.emoji
from (values
  ('Rice Bowl','Chicken Mentai Bowl', 58000, '🍱'),
  ('Rice Bowl','Salmon Mentai Bowl',  75000, '🍱'),
  ('Rice Bowl','Beef Teriyaki Bowl',  68000, '🍚'),
  ('Rice Bowl','Karaage Bowl',        52000, '🍱'),
  ('Sushi','Salmon Aburi (4 pcs)',    85000, '🍣'),
  ('Sushi','Tuna Nigiri (4 pcs)',     72000, '🍣'),
  ('Sushi','California Roll',         58000, '🍣'),
  ('Sushi','Dragon Roll',            95000, '🍣'),
  ('Mains','Beef Yakiniku',          72000, '🥩'),
  ('Mains','Chicken Katsu',          58000, '🍗'),
  ('Mains','Ramen Tonkotsu',         65000, '🍜'),
  ('Mains','Tempura Set',            78000, '🍤'),
  ('Beverages','Iced Matcha Latte',  27000, '🍵'),
  ('Beverages','Yuzu Lemonade',      25000, '🍋'),
  ('Beverages','Ocha (Hot/Cold)',    12000, '🍶'),
  ('Beverages','Sparkling Water',    18000, '💧')
) as m(cat, name, price, emoji)
join public.category c on c.name = m.cat;

-- Ingredients ---------------------------------------------------------------
insert into public.ingredient (name, category, unit, current_stock, min_stock) values
  ('Burger Bun',       'Bakery',  'pcs', 8,   30),
  ('Salmon Fillet',    'Seafood', 'kg',  2.4, 5),
  ('Mozzarella Cheese','Dairy',   'kg',  1.8, 3),
  ('Sushi Rice',       'Grains',  'kg',  24,  10),
  ('Chicken Thigh',    'Poultry', 'kg',  15,  6),
  ('Matcha Powder',    'Beverage','g',   900, 300),
  ('Beef Sirloin',     'Meat',    'kg',  9,   4),
  ('Ramen Noodles',    'Grains',  'pcs', 60,  40);

-- Recipe / BOM (sample links so a sale decrements stock) ---------------------
insert into public.recipe_item (menu_item_id, ingredient_id, qty_per_unit)
select mi.id, ing.id, r.qty
from (values
  ('Chicken Mentai Bowl', 'Sushi Rice',    0.18),
  ('Chicken Mentai Bowl', 'Chicken Thigh', 0.20),
  ('Salmon Aburi (4 pcs)','Salmon Fillet', 0.12),
  ('Beef Yakiniku',       'Beef Sirloin',  0.22),
  ('Ramen Tonkotsu',      'Ramen Noodles', 1.00),
  ('Iced Matcha Latte',   'Matcha Powder', 6.00)
) as r(menu, ingredient, qty)
join public.menu_item mi on mi.name = r.menu
join public.ingredient ing on ing.name = r.ingredient;

-- Demo paid orders (precomputed totals; tax 10%, no discount) ----------------
do $$
declare v_order_id uuid;
begin
  -- Order 1: 2x Chicken Mentai Bowl = 116,000 + 10% tax
  insert into public."order" (table_label, status, subtotal, tax_total, grand_total, placed_at, paid_at)
  values ('7', 'paid', 116000, 11600, 127600, now() - interval '3 hours', now() - interval '3 hours')
  returning id into v_order_id;
  insert into public.order_item (order_id, menu_item_id, name_snapshot, unit_price, qty, line_total)
  select v_order_id, id, name, price, 2, price*2 from public.menu_item where name = 'Chicken Mentai Bowl';
  insert into public.payment (order_id, method, amount, status, provider, idempotency_key, paid_at)
  values (v_order_id, 'qris', 127600, 'settled', 'midtrans', 'seed-1', now() - interval '3 hours');

  -- Order 2: 1x Salmon Aburi (85,000) + 2x Iced Matcha (54,000) = 139,000 + 10%
  insert into public."order" (table_label, status, subtotal, tax_total, grand_total, placed_at, paid_at)
  values ('12', 'paid', 139000, 13900, 152900, now() - interval '2 hours', now() - interval '2 hours')
  returning id into v_order_id;
  insert into public.order_item (order_id, menu_item_id, name_snapshot, unit_price, qty, line_total)
  select v_order_id, id, name, price, 1, price*1 from public.menu_item where name = 'Salmon Aburi (4 pcs)';
  insert into public.order_item (order_id, menu_item_id, name_snapshot, unit_price, qty, line_total)
  select v_order_id, id, name, price, 2, price*2 from public.menu_item where name = 'Iced Matcha Latte';
  insert into public.payment (order_id, method, amount, status, provider, idempotency_key, paid_at)
  values (v_order_id, 'card', 152900, 'settled', 'midtrans', 'seed-2', now() - interval '2 hours');

  -- Order 3: 3x Ramen Tonkotsu (195,000) + 10%
  insert into public."order" (table_label, status, subtotal, tax_total, grand_total, placed_at, paid_at)
  values ('3', 'paid', 195000, 19500, 214500, now() - interval '1 hours', now() - interval '1 hours')
  returning id into v_order_id;
  insert into public.order_item (order_id, menu_item_id, name_snapshot, unit_price, qty, line_total)
  select v_order_id, id, name, price, 3, price*3 from public.menu_item where name = 'Ramen Tonkotsu';
  insert into public.payment (order_id, method, amount, status, provider, idempotency_key, paid_at)
  values (v_order_id, 'cash', 214500, 'settled', 'cash', 'seed-3', now() - interval '1 hours');
end;
$$;
