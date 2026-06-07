-- ===== CHUNK 2 of 7 =====
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

