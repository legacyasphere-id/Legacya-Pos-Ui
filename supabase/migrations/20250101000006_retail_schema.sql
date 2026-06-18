-- Migration 0006: Retail schema (products, categories, inventory, transactions, transaction_items)
-- Strategy: ADDITIVE ONLY. Existing tables (menu_item, category, ingredient, order, order_item)
-- are soft-deprecated via comments but NOT dropped. Drop only after data migration is verified.
-- Rollback: see 20250101000006_retail_schema_rollback.sql

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Retail Categories
--    Separate table from legacy `category` to allow independent evolution.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.product_category (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.product_category is
  'Retail product categories. Replaces legacy `category` table (soft-deprecated, not dropped).';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Products
--    Replaces menu_item. Supports retail use case: SKU, barcode, cost price.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.product (
  id                  uuid        primary key default gen_random_uuid(),
  category_id         uuid        references public.product_category(id) on delete set null,
  name                text        not null,
  sku                 text        unique,
  barcode             text        unique,
  description         text,
  price               bigint      not null check (price >= 0),  -- IDR, no decimal
  cost_price          bigint      not null default 0 check (cost_price >= 0),
  emoji               text,
  image_url           text,
  is_available        boolean     not null default true,
  track_inventory     boolean     not null default true,
  sort_order          int         not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.product is
  'Retail products. Replaces legacy `menu_item` table (soft-deprecated, not dropped).';
comment on column public.product.price is 'Selling price in IDR (integer, no decimal).';
comment on column public.product.cost_price is 'Purchase/cost price in IDR for margin tracking.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Inventory
--    Per-product stock tracking. Replaces legacy `ingredient` table.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.inventory (
  id              uuid        primary key default gen_random_uuid(),
  product_id      uuid        not null unique references public.product(id) on delete cascade,
  qty_on_hand     numeric(12,3) not null default 0,
  qty_reserved    numeric(12,3) not null default 0,  -- allocated to open transactions
  reorder_point   numeric(12,3) not null default 0,
  reorder_qty     numeric(12,3) not null default 0,
  unit            text        not null default 'pcs', -- e.g. pcs, kg, litre
  last_counted_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint inventory_qty_on_hand_non_negative check (qty_on_hand >= 0),
  constraint inventory_qty_reserved_non_negative check (qty_reserved >= 0)
);

comment on table public.inventory is
  'Stock levels per product. Replaces legacy `ingredient` table (soft-deprecated, not dropped).';
comment on column public.inventory.qty_reserved is
  'Qty allocated to open (unpaid) transactions; deducted from available stock calculations.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Inventory Movements (audit trail)
-- ─────────────────────────────────────────────────────────────────────────────
create type public.inventory_movement_kind as enum (
  'sale',        -- deducted by a completed transaction
  'return',      -- returned by a voided/refunded transaction
  'purchase',    -- stock received from supplier
  'adjustment',  -- manual count correction
  'waste'        -- shrinkage/waste write-off
);

create table if not exists public.inventory_movement (
  id              uuid        primary key default gen_random_uuid(),
  inventory_id    uuid        not null references public.inventory(id) on delete restrict,
  kind            public.inventory_movement_kind not null,
  qty_delta       numeric(12,3) not null,  -- positive = stock in, negative = stock out
  qty_after       numeric(12,3) not null,  -- snapshot of qty_on_hand after this move
  reference_id    uuid,                    -- transaction_id or purchase_order_id
  note            text,
  created_by      uuid        references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

comment on table public.inventory_movement is
  'Append-only ledger of all inventory changes for auditing and burn-rate calculation.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Transactions (retail sales)
--    Replaces legacy `order` table for retail context.
-- ─────────────────────────────────────────────────────────────────────────────
create type public.transaction_status as enum (
  'open',       -- cart is active, not yet paid
  'completed',  -- payment settled
  'void'        -- cancelled after creation
);

create table if not exists public.transaction (
  id              uuid        primary key default gen_random_uuid(),
  txn_no          text        not null unique,  -- human-readable: TXN-20250618-0001
  cashier_id      uuid        references public.profiles(id) on delete set null,
  discount_id     uuid        references public.discount(id) on delete set null,
  status          public.transaction_status not null default 'open',
  payment_status  public.order_payment_status not null default 'unpaid',  -- reuse existing enum
  subtotal        bigint      not null default 0 check (subtotal >= 0),
  discount_amount bigint      not null default 0 check (discount_amount >= 0),
  tax_amount      bigint      not null default 0 check (tax_amount >= 0),
  grand_total     bigint      not null default 0 check (grand_total >= 0),
  note            text,
  void_reason     text,
  voided_at       timestamptz,
  voided_by       uuid        references public.profiles(id) on delete set null,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.transaction is
  'Retail sales transactions. Replaces legacy `order` table (soft-deprecated, not dropped).';
comment on column public.transaction.txn_no is
  'Human-readable transaction number. Format: TXN-YYYYMMDD-NNNN (padded sequence per day).';
comment on column public.transaction.payment_status is
  'Reuses order_payment_status enum: unpaid | paid | refunded | void.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Transaction Items
--    Line items for each transaction. Replaces legacy `order_item`.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.transaction_item (
  id              uuid        primary key default gen_random_uuid(),
  transaction_id  uuid        not null references public.transaction(id) on delete cascade,
  product_id      uuid        references public.product(id) on delete set null,
  name_snapshot   text        not null,  -- product name at time of sale (denormalized)
  sku_snapshot    text,                  -- SKU at time of sale
  price_snapshot  bigint      not null,  -- unit price at time of sale
  cost_snapshot   bigint      not null default 0,
  qty             int         not null check (qty > 0),
  line_total      bigint      not null,  -- price_snapshot * qty
  created_at      timestamptz not null default now()
);

comment on table public.transaction_item is
  'Line items per transaction. Snapshots product name/price at time of sale for receipt accuracy.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Indexes
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists idx_product_category_id    on public.product(category_id);
create index if not exists idx_product_sku            on public.product(sku) where sku is not null;
create index if not exists idx_product_is_available   on public.product(is_available);
create index if not exists idx_inventory_product_id   on public.inventory(product_id);
create index if not exists idx_inventory_movement_inv on public.inventory_movement(inventory_id);
create index if not exists idx_transaction_status     on public.transaction(status);
create index if not exists idx_transaction_created_at on public.transaction(created_at desc);
create index if not exists idx_transaction_cashier    on public.transaction(cashier_id);
create index if not exists idx_txn_item_txn_id        on public.transaction_item(transaction_id);
create index if not exists idx_txn_item_product_id    on public.transaction_item(product_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. updated_at triggers
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_product_category
  before update on public.product_category
  for each row execute function public.set_updated_at();

create trigger set_updated_at_product
  before update on public.product
  for each row execute function public.set_updated_at();

create trigger set_updated_at_inventory
  before update on public.inventory
  for each row execute function public.set_updated_at();

create trigger set_updated_at_transaction
  before update on public.transaction
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Row-Level Security
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.product_category  enable row level security;
alter table public.product           enable row level security;
alter table public.inventory         enable row level security;
alter table public.inventory_movement enable row level security;
alter table public.transaction       enable row level security;
alter table public.transaction_item  enable row level security;

-- product_category: all authenticated users can read; only owner/manager can write
create policy "product_category_read" on public.product_category
  for select to authenticated using (true);

create policy "product_category_write" on public.product_category
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

-- product: all authenticated can read; owner/manager can write
create policy "product_read" on public.product
  for select to authenticated using (true);

create policy "product_write" on public.product
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

-- inventory: all authenticated can read; owner/manager can write
create policy "inventory_read" on public.inventory
  for select to authenticated using (true);

create policy "inventory_write" on public.inventory
  for all to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

-- inventory_movement: all authenticated can read; insert via RPC only (SECURITY DEFINER)
create policy "inventory_movement_read" on public.inventory_movement
  for select to authenticated using (true);

-- Inserts to inventory_movement are handled by SECURITY DEFINER functions only.
-- No direct insert policy for authenticated users.

-- transaction: all authenticated can read; cashier/owner/manager can insert
create policy "transaction_read" on public.transaction
  for select to authenticated using (true);

create policy "transaction_insert" on public.transaction
  for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('owner', 'manager', 'cashier')
    )
  );

-- Only owner/manager can void (update status to void)
create policy "transaction_update" on public.transaction
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

-- transaction_item: all authenticated can read; insert via RPC only
create policy "transaction_item_read" on public.transaction_item
  for select to authenticated using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Soft-deprecation notices on legacy tables
-- ─────────────────────────────────────────────────────────────────────────────
comment on table public.category is
  'SOFT-DEPRECATED as of migration 0006. Use product_category instead. Will be dropped after data migration.';

comment on table public.menu_item is
  'SOFT-DEPRECATED as of migration 0006. Use product instead. Will be dropped after data migration.';

comment on table public.ingredient is
  'SOFT-DEPRECATED as of migration 0006. Use inventory instead. Will be dropped after data migration.';
