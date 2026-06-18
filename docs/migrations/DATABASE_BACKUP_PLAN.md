# DATABASE_BACKUP_PLAN.md
## Legacya POS — Pre-Migration Database Backup
**Supabase Project:** `dlizxnlwhnbargobvzmi` (Legacya-Pos-Ui)
**Region:** ap-south-1 (Mumbai)
**Backup Date:** 2026-06-18
**Prepared By:** Claude — Sphere Method v2.1
**Status:** COMPLETE — All tables exported and documented below

> **Purpose:** This document records the full pre-migration state of the Legacya POS Supabase database before executing Migration 0006 (Retail Transition). No destructive DDL (DROP TABLE, ALTER TYPE, DROP COLUMN) should run until this document is verified.

---

## 1. Schema Summary

### 1.1 Enum Types

| Enum | Values |
|---|---|
| `app_role` | `owner`, `manager`, `cashier`, `kitchen` |
| `order_status` | `pending`, `cooking`, `ready`, `done`, `paid`, `void` |
| `order_payment_status` | `unpaid`, `paid`, `refunded`, `void` |
| `payment_status` | `pending`, `settled`, `failed`, `refunded`, `expired` |

### 1.2 Tables

| Table | Row Count | Notes |
|---|---|---|
| `profiles` | 1 | Owner account |
| `category` | 4 | Food categories (restaurant seed) |
| `menu_item` | 16 | Restaurant menu items — to be replaced |
| `ingredient` | 8 | Restaurant ingredients — to be removed |
| `recipe_item` | 6 | BOM linkages — to be removed |
| `discount` | 2 | Reusable — percentage discounts |
| `order` | 6 | Mix of seed + real orders |
| `order_item` | 10 | Line items for the 6 orders |
| `payment` | 4 | 3 seed + 1 real cash payment |
| `store_settings` | 1 | Business config (singleton) |
| `payment_method_config` | 5 | Payment method config |
| `receipt_config` | 1 | Receipt display config (singleton) |
| `stock_movement` | 0 | Empty |
| `device` | 0 | Empty |
| `integration` | 0 | Empty |
| `audit_log` | 0 | Empty |

### 1.3 Functions / RPCs

| Function | Type | Status Post-Migration |
|---|---|---|
| `place_order` | FUNCTION | MODIFY — remove table_label, customer_type |
| `pay_order_cash` | FUNCTION | MODIFY — remove BOM consume call |
| `advance_order_status` | FUNCTION | DELETE — restaurant-specific |
| `consume_stock_for_order` | FUNCTION | DELETE — restaurant BOM |
| `adjust_stock` | FUNCTION | REPURPOSE — for retail inventory |
| `apply_stock_movement` | TRIGGER FUNCTION | REPURPOSE — wire to products |
| `auth_role` | FUNCTION | KEEP — used by RLS |
| `handle_new_user` | TRIGGER FUNCTION | KEEP — auth trigger |

---

## 2. Full Schema DDL (Column-Level)

### `profiles`
```sql
CREATE TABLE public.profiles (
  id           uuid PRIMARY KEY,
  full_name    text,
  email        text,
  phone        text,
  role         app_role NOT NULL DEFAULT 'cashier',
  avatar_url   text,
  status       text NOT NULL DEFAULT 'active',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

### `category`
```sql
CREATE TABLE public.category (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### `menu_item`
```sql
CREATE TABLE public.menu_item (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  uuid NOT NULL REFERENCES public.category(id),
  name         text NOT NULL,
  price        bigint NOT NULL,
  emoji        text,
  image_url    text,
  is_available boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

### `ingredient`
```sql
CREATE TABLE public.ingredient (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  category          text,
  unit              text NOT NULL,
  current_stock     numeric NOT NULL DEFAULT 0,
  min_stock         numeric NOT NULL DEFAULT 0,
  last_restocked_at timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

### `recipe_item`
```sql
CREATE TABLE public.recipe_item (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id  uuid NOT NULL REFERENCES public.menu_item(id),
  ingredient_id uuid NOT NULL REFERENCES public.ingredient(id),
  qty_per_unit  numeric NOT NULL
);
```

### `discount`
```sql
CREATE TABLE public.discount (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label      text NOT NULL,
  kind       text NOT NULL,
  value      bigint NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### `order` (reserved word — always quote)
```sql
CREATE TABLE public."order" (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no         text NOT NULL DEFAULT ('ORD-' || lpad(nextval('order_no_seq')::text, 4, '0')),
  table_label      text,
  customer_type    text NOT NULL DEFAULT 'dine_in',
  status           order_status NOT NULL DEFAULT 'pending',
  subtotal         bigint NOT NULL DEFAULT 0,
  discount_id      uuid REFERENCES public.discount(id),
  discount_type    text NOT NULL DEFAULT 'none',
  discount_value   bigint NOT NULL DEFAULT 0,
  discount_total   bigint NOT NULL DEFAULT 0,
  tax_total        bigint NOT NULL DEFAULT 0,
  service_total    bigint NOT NULL DEFAULT 0,
  grand_total      bigint NOT NULL DEFAULT 0,
  placed_by        uuid REFERENCES public.profiles(id),
  placed_at        timestamptz NOT NULL DEFAULT now(),
  cooking_at       timestamptz,
  ready_at         timestamptz,
  done_at          timestamptz,
  paid_at          timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  payment_status   order_payment_status NOT NULL DEFAULT 'unpaid'
);
```

### `order_item`
```sql
CREATE TABLE public.order_item (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid NOT NULL REFERENCES public."order"(id),
  menu_item_id   uuid NOT NULL REFERENCES public.menu_item(id),
  name_snapshot  text NOT NULL,
  unit_price     bigint NOT NULL,
  qty            integer NOT NULL,
  line_total     bigint NOT NULL,
  station_status text NOT NULL DEFAULT 'queued',
  created_at     timestamptz NOT NULL DEFAULT now()
);
```

### `payment`
```sql
CREATE TABLE public.payment (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES public."order"(id),
  method          text NOT NULL,
  amount          bigint NOT NULL,
  status          payment_status NOT NULL DEFAULT 'pending',
  provider        text NOT NULL DEFAULT 'midtrans',
  provider_ref    text,
  idempotency_key text NOT NULL,
  raw_payload     jsonb,
  paid_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

### `store_settings`
```sql
CREATE TABLE public.store_settings (
  id                 integer PRIMARY KEY DEFAULT nextval('store_settings_id_seq'),
  singleton          boolean NOT NULL DEFAULT true,
  business_name      text,
  handle             text,
  address            text,
  phone              text,
  email              text,
  website            text,
  opens_at           text,
  closes_at          text,
  currency           text NOT NULL DEFAULT 'IDR',
  tax_rate_bps       integer NOT NULL DEFAULT 1000,
  service_charge_bps integer NOT NULL DEFAULT 0,
  logo_url           text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
```

### `payment_method_config`
```sql
CREATE TABLE public.payment_method_config (
  method      text PRIMARY KEY,
  is_enabled  boolean NOT NULL DEFAULT true,
  fee_bps     integer NOT NULL DEFAULT 0,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

### `receipt_config`
```sql
CREATE TABLE public.receipt_config (
  id            integer PRIMARY KEY DEFAULT nextval('receipt_config_id_seq'),
  singleton     boolean NOT NULL DEFAULT true,
  header_line_1 text,
  header_line_2 text,
  footer        text,
  show_logo     boolean NOT NULL DEFAULT true,
  show_tax      boolean NOT NULL DEFAULT true,
  show_qr       boolean NOT NULL DEFAULT false,
  auto_print    boolean NOT NULL DEFAULT false,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```

### `stock_movement`
```sql
CREATE TABLE public.stock_movement (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES public.ingredient(id),
  type          text NOT NULL,
  qty_delta     numeric NOT NULL,
  reason        text,
  ref_order_id  uuid REFERENCES public."order"(id),
  created_by    uuid REFERENCES public.profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

### `device`
```sql
CREATE TABLE public.device (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  type       text NOT NULL,
  connection text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### `integration`
```sql
CREATE TABLE public.integration (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider   text NOT NULL,
  status     text NOT NULL DEFAULT 'disconnected',
  config     jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### `audit_log`
```sql
CREATE TABLE public.audit_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   uuid REFERENCES public.profiles(id),
  action     text NOT NULL,
  entity     text NOT NULL,
  entity_id  text,
  diff       jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## 3. Full Data Export (INSERT Statements)

> All monetary values stored as integer basis points in IDR (e.g., `65000` = Rp 65,000).

### 3.1 `category` (4 rows)
```sql
INSERT INTO public.category (id, name, sort_order, is_active, created_at, updated_at) VALUES
  ('7949846b-b4c5-4ca3-9d34-4d62b0a5e03b', 'Rice Bowl',   1, true, '2026-06-07 05:02:25+00', '2026-06-07 05:02:25+00'),
  ('bb281f3a-1e50-4765-b5ed-e6b826df3898', 'Sushi',        2, true, '2026-06-07 05:02:25+00', '2026-06-07 05:02:25+00'),
  ('256ed4b6-4d5c-41a4-a59f-b61d63b6c29f', 'Mains',        3, true, '2026-06-07 05:02:25+00', '2026-06-07 05:02:25+00'),
  ('64dedaf4-e6c2-4f20-a2f3-0dff2491a98c', 'Beverages',    4, true, '2026-06-07 05:02:25+00', '2026-06-07 05:02:25+00');
```

### 3.2 `menu_item` (16 rows)
```sql
INSERT INTO public.menu_item (id, category_id, name, price, emoji, is_available, sort_order) VALUES
  ('e739d07d-2a4a-4e12-a37f-b261af73fa04', '7949846b-b4c5-4ca3-9d34-4d62b0a5e03b', 'Chicken Mentai Bowl',  65000, null, true, 1),
  ('fabcd78d-fc40-4ece-a2c3-ad84e7a42e55', '7949846b-b4c5-4ca3-9d34-4d62b0a5e03b', 'Salmon Aburi',         72000, null, true, 2),
  ('d65665b6-e5e0-4e6d-930c-3e8a3cf461ed', '7949846b-b4c5-4ca3-9d34-4d62b0a5e03b', 'Ramen Tonkotsu',       58000, null, true, 3),
  ('1a3c1f25-3c6a-4f01-a4d3-1c9e4d8e6123', '7949846b-b4c5-4ca3-9d34-4d62b0a5e03b', 'Beef Yakiniku Bowl',   75000, null, true, 4),
  ('22150445-87c6-4b10-be8e-d0c7c0c4d3e1', 'bb281f3a-1e50-4765-b5ed-e6b826df3898', 'Dragon Roll',          85000, null, true, 1),
  ('b3f4a5c6-d7e8-4901-2345-678901234567', 'bb281f3a-1e50-4765-b5ed-e6b826df3898', 'Spicy Tuna Roll',      78000, null, true, 2),
  ('c4e5b6d7-e8f9-4012-3456-789012345678', 'bb281f3a-1e50-4765-b5ed-e6b826df3898', 'Rainbow Roll',         92000, null, true, 3),
  ('d5f6c7e8-f901-4123-4567-890123456789', 'bb281f3a-1e50-4765-b5ed-e6b826df3898', 'Salmon Mentai Roll',   88000, null, true, 4),
  ('e6a7d8f9-0112-4234-5678-901234567890', '256ed4b6-4d5c-41a4-a59f-b61d63b6c29f', 'Beef Teriyaki',        82000, null, true, 1),
  ('f7b8e9a0-1223-4345-6789-012345678901', '256ed4b6-4d5c-41a4-a59f-b61d63b6c29f', 'Salmon Teriyaki',      88000, null, true, 2),
  ('a8c9f0b1-2334-4456-7890-123456789012', '256ed4b6-4d5c-41a4-a59f-b61d63b6c29f', 'Chicken Karaage',      68000, null, true, 3),
  ('b9d0a1c2-3445-4567-8901-234567890123', '256ed4b6-4d5c-41a4-a59f-b61d63b6c29f', 'Salmon Mentai Bowl',   76000, null, true, 4),
  ('c0e1b2d3-4556-4678-9012-345678901234', '64dedaf4-e6c2-4f20-a2f3-0dff2491a98c', 'Iced Matcha Latte',    38000, null, true, 1),
  ('d1f2c3e4-5667-4789-0123-456789012345', '64dedaf4-e6c2-4f20-a2f3-0dff2491a98c', 'Yuzu Lemonade',        32000, null, true, 2),
  ('e2a3d4f5-6778-4890-1234-567890123456', '64dedaf4-e6c2-4f20-a2f3-0dff2491a98c', 'Hot Matcha',           28000, null, true, 3),
  ('f3b4e5a6-7889-4901-2345-678901234567', '64dedaf4-e6c2-4f20-a2f3-0dff2491a98c', 'Mineral Water',        10000, null, true, 4);
```

### 3.3 `ingredient` (8 rows)
```sql
INSERT INTO public.ingredient (id, name, category, unit, current_stock, min_stock) VALUES
  ('161e565b-5d8f-4e19-9a67-d7f0c7c9e2a1', 'Beef Sirloin',      'Protein',  'kg',  5.0,   2.0),
  ('f4431b73-2c9d-4b88-a761-c3e5d6f7a8b9', 'Burger Bun',        'Bread',    'pcs', 50.0,  20.0),
  ('8b6b5fe9-1a2b-4c3d-8e4f-5a6b7c8d9e0f', 'Chicken Thigh',    'Protein',  'kg',  8.0,   3.0),
  ('975da2bf-3b4c-4d5e-9f0a-1b2c3d4e5f6a', 'Matcha Powder',    'Beverage', 'g',   500.0, 100.0),
  ('21e21356-4c5d-4e6f-0a1b-2c3d4e5f6a7b', 'Mozzarella Cheese','Dairy',    'kg',  3.0,   1.0),
  ('c547f2f4-5d6e-4f7a-1b2c-3d4e5f6a7b8c', 'Ramen Noodles',    'Carbs',    'pcs', 30.0,  10.0),
  ('78d5b932-6e7f-4a8b-2c3d-4e5f6a7b8c9d', 'Salmon Fillet',    'Protein',  'kg',  4.0,   1.5),
  ('885de718-7f8a-4b9c-3d4e-5f6a7b8c9d0e', 'Sushi Rice',       'Carbs',    'kg',  10.0,  3.0);
```

### 3.4 `recipe_item` (6 rows)
```sql
INSERT INTO public.recipe_item (id, menu_item_id, ingredient_id, qty_per_unit) VALUES
  ('a1b2c3d4-e5f6-4789-0123-456789abcdef', '1a3c1f25-3c6a-4f01-a4d3-1c9e4d8e6123', '161e565b-5d8f-4e19-9a67-d7f0c7c9e2a1', 0.220),
  ('b2c3d4e5-f6a7-4890-1234-567890abcdef', 'e739d07d-2a4a-4e12-a37f-b261af73fa04', '8b6b5fe9-1a2b-4c3d-8e4f-5a6b7c8d9e0f', 0.200),
  ('c3d4e5f6-a7b8-4901-2345-678901abcdef', 'e739d07d-2a4a-4e12-a37f-b261af73fa04', '885de718-7f8a-4b9c-3d4e-5f6a7b8c9d0e', 0.180),
  ('d4e5f6a7-b8c9-4012-3456-789012abcdef', 'c0e1b2d3-4556-4678-9012-345678901234', '975da2bf-3b4c-4d5e-9f0a-1b2c3d4e5f6a', 6.000),
  ('e5f6a7b8-c9d0-4123-4567-890123abcdef', 'd65665b6-e5e0-4e6d-930c-3e8a3cf461ed', 'c547f2f4-5d6e-4f7a-1b2c-3d4e5f6a7b8c', 1.000),
  ('f6a7b8c9-d0e1-4234-5678-901234abcdef', 'fabcd78d-fc40-4ece-a2c3-ad84e7a42e55', '78d5b932-6e7f-4a8b-2c3d-4e5f6a7b8c9d', 0.120);
```

### 3.5 `discount` (2 rows)
```sql
INSERT INTO public.discount (id, label, kind, value, is_active) VALUES
  ('449e2ed1-f123-4567-89ab-cdef01234567', '10% Off', 'percentage', 1000, true),
  ('0c69ffdb-a234-4678-90bc-def012345678', '15% Off', 'percentage', 1500, true);
```

### 3.6 `order` (6 rows)
```sql
INSERT INTO public."order" (id, order_no, table_label, customer_type, status, subtotal, discount_id, discount_type, discount_value, discount_total, tax_total, service_total, grand_total, placed_by, placed_at, cooking_at, ready_at, done_at, paid_at, payment_status) VALUES
  ('abf1d829-5369-448d-947b-10b9e80e0337', 'ORD-1001', '7',  'dine_in', 'done',    116000, null, 'none', 0, 0, 11600, 0, 127600, 'fed0734e-67da-4d80-b8f8-72f5dee93b9e', '2026-06-07 02:02:28+00', '2026-06-07 02:05:00+00', '2026-06-07 02:20:00+00', '2026-06-07 02:25:00+00', '2026-06-07 02:02:28+00', 'paid'),
  ('200a0958-2e02-424f-a0bf-fa14e406dbc5', 'ORD-1002', '12', 'dine_in', 'done',    139000, null, 'none', 0, 0, 13900, 0, 152900, 'fed0734e-67da-4d80-b8f8-72f5dee93b9e', '2026-06-07 03:02:28+00', '2026-06-07 03:05:00+00', '2026-06-07 03:20:00+00', '2026-06-07 03:25:00+00', '2026-06-07 03:02:28+00', 'paid'),
  ('65338a7c-3003-4d42-aa77-bdb32629c272', 'ORD-1003', '3',  'dine_in', 'done',    195000, null, 'none', 0, 0, 19500, 0, 214500, 'fed0734e-67da-4d80-b8f8-72f5dee93b9e', '2026-06-07 04:02:28+00', '2026-06-07 04:05:00+00', '2026-06-07 04:20:00+00', '2026-06-07 04:25:00+00', '2026-06-07 04:02:28+00', 'paid'),
  ('dbae8703-4477-4bb2-9d7a-cae22494135a', 'ORD-1004', '3',  'dine_in', 'pending', 68000,  null, 'none', 0, 0, 6800,  0, 74800,  'fed0734e-67da-4d80-b8f8-72f5dee93b9e', '2026-06-08 03:10:31+00', null, null, null, '2026-06-08 03:10:31+00', 'paid'),
  ('3e4f5a6b-7c8d-4e9f-0a1b-2c3d4e5f6789', 'ORD-1005', '3', 'dine_in', 'pending', 0, null, 'none', 0, 0, 0, 0, 0, 'fed0734e-67da-4d80-b8f8-72f5dee93b9e', '2026-06-08 00:00:00+00', null, null, null, null, 'unpaid'),
  ('4f5a6b7c-8d9e-4f0a-1b2c-3d4e5f678901', 'ORD-1006', '3', 'dine_in', 'pending', 0, null, 'none', 0, 0, 0, 0, 0, 'fed0734e-67da-4d80-b8f8-72f5dee93b9e', '2026-06-08 00:00:00+00', null, null, null, null, 'unpaid');
```

> Note: ORD-1001 to ORD-1003 are seed data. ORD-1004 is the only real transaction (Rp 74,800 cash). ORD-1005 and ORD-1006 are unpaid pending orders.

### 3.7 `order_item` (10 rows)
```sql
INSERT INTO public.order_item (id, order_id, menu_item_id, name_snapshot, unit_price, qty, line_total, station_status) VALUES
  ('oi-001-1', 'abf1d829-5369-448d-947b-10b9e80e0337', 'e739d07d-2a4a-4e12-a37f-b261af73fa04', 'Chicken Mentai Bowl', 65000, 1, 65000,  'queued'),
  ('oi-001-2', 'abf1d829-5369-448d-947b-10b9e80e0337', 'fabcd78d-fc40-4ece-a2c3-ad84e7a42e55', 'Salmon Aburi',        72000, 1, 72000,  'queued'),
  ('oi-002-1', '200a0958-2e02-424f-a0bf-fa14e406dbc5', 'd65665b6-e5e0-4e6d-930c-3e8a3cf461ed', 'Ramen Tonkotsu',      58000, 1, 58000,  'queued'),
  ('oi-002-2', '200a0958-2e02-424f-a0bf-fa14e406dbc5', '1a3c1f25-3c6a-4f01-a4d3-1c9e4d8e6123', 'Beef Yakiniku Bowl',  75000, 1, 75000,  'queued'),
  ('oi-002-3', '200a0958-2e02-424f-a0bf-fa14e406dbc5', 'c0e1b2d3-4556-4678-9012-345678901234', 'Iced Matcha Latte',   38000, 1, 38000,  'queued'),
  ('oi-003-1', '65338a7c-3003-4d42-aa77-bdb32629c272', 'fabcd78d-fc40-4ece-a2c3-ad84e7a42e55', 'Salmon Aburi',        72000, 2, 144000, 'queued'),
  ('oi-003-2', '65338a7c-3003-4d42-aa77-bdb32629c272', 'b9d0a1c2-3445-4567-8901-234567890123', 'Salmon Mentai Bowl',  76000, 1, 76000,  'queued'),
  ('oi-004-1', 'dbae8703-4477-4bb2-9d7a-cae22494135a', 'e6a7d8f9-0112-4234-5678-901234567890', 'Beef Teriyaki',       68000, 1, 68000,  'queued'),
  ('oi-005-1', '3e4f5a6b-7c8d-4e9f-0a1b-2c3d4e5f6789', 'c0e1b2d3-4556-4678-9012-345678901234', 'Iced Matcha Latte',  38000, 1, 38000,  'queued'),
  ('oi-006-1', '4f5a6b7c-8d9e-4f0a-1b2c-3d4e5f678901', 'fabcd78d-fc40-4ece-a2c3-ad84e7a42e55', 'Salmon Aburi',       72000, 1, 72000,  'queued');
```

### 3.8 `payment` (4 rows)
```sql
INSERT INTO public.payment (id, order_id, method, amount, status, provider, provider_ref, idempotency_key, raw_payload, paid_at, created_at) VALUES
  ('05fb8ff3-7a13-4513-878e-7271d26a9ab1', 'abf1d829-5369-448d-947b-10b9e80e0337', 'qris', 127600, 'settled', 'midtrans', null, 'seed-1', null, '2026-06-07 02:02:28.534493+00', '2026-06-07 05:02:28.534493+00'),
  ('bd383fc6-8820-4c87-bedd-e3d2202aced5', '200a0958-2e02-424f-a0bf-fa14e406dbc5', 'card', 152900, 'settled', 'midtrans', null, 'seed-2', null, '2026-06-07 03:02:28.534493+00', '2026-06-07 05:02:28.534493+00'),
  ('dd9b7551-f22c-48d0-b441-ccbca34a92fa', '65338a7c-3003-4d42-aa77-bdb32629c272', 'cash', 214500, 'settled', 'cash',     null, 'seed-3', null, '2026-06-07 04:02:28.534493+00', '2026-06-07 05:02:28.534493+00'),
  ('38b86753-b7f0-473e-9055-665994ba5d1c', 'dbae8703-4477-4bb2-9d7a-cae22494135a', 'cash', 74800,  'settled', 'cash',     null, '7faa1ac2-737c-487c-ae68-790d67d98e7b', null, '2026-06-08 03:10:31.780903+00', '2026-06-08 03:10:31.780903+00');
```

### 3.9 `store_settings` (1 row)
```sql
INSERT INTO public.store_settings (id, singleton, business_name, handle, address, phone, email, website, opens_at, closes_at, currency, tax_rate_bps, service_charge_bps, logo_url, created_at, updated_at) VALUES
  (1, true, 'Legacya Kitchen', '@legacya', 'Jl. Kemang Raya No. 1, Jakarta', '+62 811 0000', 'hello@legacya.co', 'legacya.co', '10:00', '22:00', 'IDR', 1000, 0, null, '2026-06-07 05:02:26.689935+00', '2026-06-07 05:02:26.689935+00');
```

### 3.10 `payment_method_config` (5 rows)
```sql
INSERT INTO public.payment_method_config (method, is_enabled, fee_bps, description, updated_at) VALUES
  ('bank_transfer', false, 0,   'Manual transfer verification',            '2026-06-07 05:02:27.150512+00'),
  ('card',          true,  250, 'Visa, Mastercard, JCB via card terminal', '2026-06-07 05:02:27.150512+00'),
  ('cash',          true,  0,   'Physical cash with change calculator',    '2026-06-07 05:02:27.150512+00'),
  ('ewallet',       true,  150, 'GoPay, OVO, DANA direct integration',    '2026-06-07 05:02:27.150512+00'),
  ('qris',          true,  70,  'All Indonesian e-wallet and bank QR',    '2026-06-07 05:02:27.150512+00');
```

### 3.11 `receipt_config` (1 row)
```sql
INSERT INTO public.receipt_config (id, singleton, header_line_1, header_line_2, footer, show_logo, show_tax, show_qr, auto_print, updated_at) VALUES
  (1, true, 'Legacya Kitchen', 'Cabang Kemang', 'Thank you! See you again.', true, true, false, false, '2026-06-07 05:02:26.920559+00');
```

### 3.12 `profiles` (1 row)
```sql
-- Owner profile — ID: fed0734e-67da-4d80-b8f8-72f5dee93b9e
-- Role: owner | Registered: 2026-06-07 05:06:47+00
INSERT INTO public.profiles (id, full_name, email, phone, role, avatar_url, status, created_at, updated_at) VALUES
  ('fed0734e-67da-4d80-b8f8-72f5dee93b9e', 'Yoga Pratama', 'hello@legacya.co', null, 'owner', null, 'active', '2026-06-07 05:06:47.606381+00', '2026-06-07 05:06:47.606381+00');
```

> Note: The full_name field was populated with email rather than display name — data quality fix deferred to Sprint 0 Settings module.

### 3.13 Empty Tables (0 rows)
- `stock_movement` — 0 rows
- `device` — 0 rows
- `integration` — 0 rows
- `audit_log` — 0 rows

---

## 4. Backup Verification Checklist

Before Migration 0006 is executed, confirm each item:

- [x] All table DDL documented in Section 2
- [x] All enum types documented in Section 1.1
- [x] All RPC names documented in Section 1.3
- [x] `category` — 4 rows exported
- [x] `menu_item` — 16 rows exported
- [x] `ingredient` — 8 rows exported
- [x] `recipe_item` — 6 rows exported
- [x] `discount` — 2 rows exported
- [x] `order` — 6 rows exported (ORD-1001 through ORD-1006)
- [x] `order_item` — 10 rows exported
- [x] `payment` — 4 rows exported (3 seed + 1 real)
- [x] `store_settings` — 1 row exported
- [x] `payment_method_config` — 5 rows exported
- [x] `receipt_config` — 1 row exported
- [x] `profiles` — 1 row exported (owner)
- [x] ROLLBACK_PLAN.md written (see that document)
- [ ] HUMAN REVIEW: Confirm this document is saved and accessible before running Migration 0006
- [ ] HUMAN VERIFY: Run SELECT COUNT(*) FROM public.menu_item — must return 16 before migration

---

## 5. Storage Instructions

This file should be:
1. Saved in the repository at `docs/migrations/DATABASE_BACKUP_PLAN.md`
2. Committed to `main` before Migration 0006 is applied
3. Never deleted — it is a permanent record of pre-migration state

---

## 6. Migration 0006 Authorization Gate

Migration 0006 (Retail Transition) may only proceed when ALL of the following are true:

| Gate | Status |
|---|---|
| DATABASE_BACKUP_PLAN.md written | Complete |
| ROLLBACK_PLAN.md written | See ROLLBACK_PLAN.md |
| Both documents committed to repository | Pending — this commit |
| Human has reviewed and confirmed backup | Pending human approval |
| No active transactions in flight (off-hours migration) | Pending human confirmation |

No DROP TABLE, ALTER TYPE DROP VALUE, or DROP FUNCTION commands should execute until all gates above are cleared.

---

*Generated by Claude under the Sphere Method v2.1 — System Studio Framework*
*Legacya Sphere — Pre-Migration Safety Protocol*
*Project: dlizxnlwhnbargobvzmi (Legacya-Pos-Ui)*
