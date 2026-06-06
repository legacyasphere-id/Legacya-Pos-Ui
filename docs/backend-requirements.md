# LegacyaPOS — Backend Requirements & Spec (Supabase)

> **Status:** Build-ready blueprint for the backend that the existing React/Vite frontend needs.
> The app is currently a 100% mocked prototype (no API, no auth, no persistence except the
> theme preference). This document specifies the data model, security, and server logic to
> back every feature, mapped to the product's 3-phase roadmap.

---

## 1. Overview & assumptions

| Decision | Value | Rationale |
|---|---|---|
| Stack | **Supabase** (Postgres + Auth + RLS + Realtime + Storage + Edge Functions + pg_cron) | Covers auth/roles, realtime (KDS, notifications), scheduled rollups, file uploads, and server-side payment logic without a separate API server for P1–P2. |
| Tenancy | **Single location** | One restaurant, one branch. **No `branch_id` / org root** on records. RLS scopes by **role + authenticated user** only. *(Reversible: re-introducing a `branch_id` column + policy predicate is the migration path to P2 "Multi-branch operations".)* |
| Payments | **Midtrans** | Server-side only via Edge Functions (`charge` + `webhook`); card/QRIS data never touches the client. Supports QRIS, cards, e-wallets (GoPay/ShopeePay), VA/bank transfer. |
| Money | **Integer Rupiah (IDR)** | IDR has no commonly-used subunit. Store all amounts as `bigint` rupiah. Never use floats. All subtotal/discount/tax/service computed **server-side**. |
| Timezone | **Asia/Jakarta (WIB)** | Daily rollups, "today" filters, quiet hours computed in WIB; store timestamps as `timestamptz` (UTC) and convert at query time. |
| Realtime transport | **Supabase Realtime** | Postgres change streams power the Kitchen Display board and live notifications — no dedicated WebSocket server. |
| Server logic | **Postgres RPC + Edge Functions** | Atomic multi-table writes (order→payment→stock) as `plpgsql` functions; external calls (Midtrans, LLM) as Edge Functions. |

**Frontend pages this backs:** Dashboard, POS Cashier, Orders, Kitchen, Inventory, Menu, Analytics, Notifications, Settings (see `src/pages/`).

---

## 2. Roles

A single `app_role` enum drives RBAC via RLS. Stored on `profiles.role` and mirrored into the JWT
as a custom claim (`role`) by an auth hook so policies can read it without a join.

```sql
create type app_role as enum ('owner', 'manager', 'cashier', 'kitchen');
```

| Role | Capability summary |
|---|---|
| `owner` | Everything, incl. Settings, Team, Account/billing, all reports. |
| `manager` | Operations + inventory + menu + analytics; manage staff except owners; settings except billing/security. |
| `cashier` | POS: create orders, take payments, view own/active orders, reprint receipts. **No** Settings/Team/Analytics-financials. |
| `kitchen` | Read the KDS queue + update order item/station status only. |

Helper used throughout policies:

```sql
create or replace function auth_role() returns app_role
language sql stable as $$
  select coalesce(
    (auth.jwt() ->> 'role')::app_role,
    (select role from profiles where id = auth.uid())
  );
$$;
```

---

## 3. Phase 1 data model (MVP)

> Conventions: `id uuid primary key default gen_random_uuid()`, `created_at timestamptz not null default now()`,
> `updated_at timestamptz` (maintained by a `moddatetime` trigger). All money columns are `bigint` IDR.
> **No `branch_id` anywhere** (single-location assumption).

### 3.1 `profiles` (Staff)
Mirror of `auth.users`; the Staff/Team list.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| full_name | text |  |
| email | text | unique; synced from auth |
| phone | text |  |
| role | app_role | not null, default `cashier` |
| avatar_url | text | Storage public URL |
| status | text | `active` / `invited` / `disabled` |

Trigger: `on auth.users insert` → create matching `profiles` row. Invite flow uses Supabase Auth invite.

### 3.2 `category`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK |  |
| name | text | not null |
| sort_order | int | default 0 |
| is_active | bool | default true |

### 3.3 `menu_item`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK |  |
| category_id | uuid FK→category | on delete restrict |
| name | text | not null |
| price | bigint | IDR, ≥ 0 |
| emoji | text | placeholder until images |
| image_url | text | Storage |
| is_available | bool | default true (Menu availability toggle) |
| sort_order | int |  |

`rating`, `sold_today` shown in the Menu UI are **derived** (see Analytics) — not columns.

### 3.4 `ingredient` (Inventory stock item)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK |  |
| name | text | not null |
| category | text | inventory grouping |
| unit | text | `pcs` / `kg` / `g` / `L` … |
| current_stock | numeric(12,3) | on-hand (fractional units allowed) |
| min_stock | numeric(12,3) | reorder threshold |
| last_restocked_at | timestamptz |  |

Derived (not stored): `status` (`critical`/`low`/`ok` from `current_stock` vs `min_stock`),
`burn_rate` & `eta_days` (from `stock_movement` history ÷ time).

### 3.5 `recipe_item` (Bill-of-Materials) — **gap filled**
Links a menu item to the ingredients it consumes, so a sale auto-decrements stock.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK |  |
| menu_item_id | uuid FK→menu_item | on delete cascade |
| ingredient_id | uuid FK→ingredient | on delete restrict |
| qty_per_unit | numeric(12,3) | ingredient consumed per 1 menu item |

Unique `(menu_item_id, ingredient_id)`.

### 3.6 `order`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK |  |
| order_no | text | human code (`ORD-1048`); unique; sequence-backed |
| table_label | text | minimal table ref (full Table Mgmt is P2) |
| customer_type | text | `dine_in` / `takeaway` (UI "customer type") |
| status | order_status | enum below |
| subtotal | bigint | sum of line totals |
| discount_type | text | `none` / `percent` / `amount` |
| discount_value | bigint | percent (basis points) or IDR amount |
| discount_total | bigint | resolved IDR |
| tax_total | bigint | computed (rate from settings, default 10%) |
| service_total | bigint | computed (service charge from settings) |
| grand_total | bigint | subtotal − discount + tax + service |
| placed_by | uuid FK→profiles |  |
| placed_at | timestamptz |  |
| cooking_at / ready_at / done_at / paid_at | timestamptz | lifecycle timestamps (power KDS elapsed + analytics) |

```sql
create type order_status as enum ('pending','cooking','ready','done','paid','void');
```
> **Status lifecycle lives in P1** (Cashier creates `pending`; Orders shows `cooking`/`ready`).
> The P2 KDS board only *consumes/advances* this.

### 3.7 `order_item`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK |  |
| order_id | uuid FK→order | on delete cascade |
| menu_item_id | uuid FK→menu_item | on delete restrict |
| name_snapshot | text | menu name at sale time |
| unit_price | bigint | price snapshot |
| qty | int | > 0 |
| line_total | bigint | `unit_price * qty` |
| station_status | text | `queued`/`cooking`/`done` (per-item for KDS, P2) |

### 3.8 `payment`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK |  |
| order_id | uuid FK→order |  |
| method | text | `qris`/`card`/`cash`/`ewallet`/`bank_transfer` |
| amount | bigint | IDR |
| status | payment_status | enum below |
| provider | text | `midtrans` / `cash` |
| provider_ref | text | Midtrans `transaction_id` / `order_id` |
| idempotency_key | text | unique; client-supplied per charge attempt |
| raw_payload | jsonb | last gateway payload (audit) |
| paid_at | timestamptz |  |

```sql
create type payment_status as enum ('pending','settled','failed','refunded','expired');
```

### 3.9 `stock_movement`
Every change to `ingredient.current_stock` writes a row (Inventory "History").

| Column | Type | Notes |
|---|---|---|
| id | uuid PK |  |
| ingredient_id | uuid FK→ingredient |  |
| type | text | `sale` / `restock` / `adjust` / `waste` |
| qty_delta | numeric(12,3) | signed (negative for consumption) |
| reason | text |  |
| ref_order_id | uuid FK→order | when `type='sale'` |
| created_by | uuid FK→profiles |  |

A trigger keeps `ingredient.current_stock` in sync with inserted movements (single source of truth).

### 3.10 `discount` — **gap filled**
Reusable discount rules behind the Cashier selector (replaces free-text %).

| Column | Type | Notes |
|---|---|---|
| id | uuid PK |  |
| label | text | "10%", "Staff" … |
| kind | text | `percent` / `amount` |
| value | bigint | basis points or IDR |
| is_active | bool |  |

### 3.11 Settings / configuration — **gap filled**

`store_settings` (single row, `id` check = true):
`business_name, handle, address, phone, email, website, opens_at, closes_at, currency,
tax_rate_bps (default 1000 = 10%), service_charge_bps, logo_url`.

`payment_method_config` (one row per method): `method, is_enabled, fee_bps, description`.

`receipt_config` (single row): `header_line_1, header_line_2, footer, show_logo, show_tax,
show_qr, auto_print`.

`device` (Devices section): `id, name, type ('printer'|'terminal'), connection, is_default`.

`integration` (Integrations section): `id, provider, status, config jsonb`.

### 3.12 `audit_log` (cross-cutting)
`id, actor_id, action, entity, entity_id, diff jsonb, created_at` — written for price changes,
voids/refunds, settings edits, role changes.

---

## 4. RLS & policies (P1)

RLS **enabled on every table**. Patterns (single-location, no branch predicate):

| Table(s) | Read | Write |
|---|---|---|
| `category`, `menu_item`, `discount` | any authenticated | `owner`,`manager` |
| `ingredient`, `recipe_item`, `stock_movement` | `owner`,`manager`,`kitchen` | `owner`,`manager` (movements: also via `place_order` RPC as definer) |
| `order`, `order_item` | `owner`,`manager`,`cashier`,`kitchen` | create/pay: `cashier`,`manager`,`owner`; advance status: also `kitchen` |
| `payment` | `owner`,`manager`,`cashier` | via RPC / Edge Function only (service role) |
| `profiles` (Team) | self always; all rows: `owner`,`manager` | `owner`,`manager` (role changes: `owner` only) |
| `store_settings`,`payment_method_config`,`receipt_config`,`device`,`integration` | `owner`,`manager` | `owner` (manager except billing) |
| `audit_log` | `owner`,`manager` | system only (definer functions) |

Example policy:
```sql
alter table "order" enable row level security;

create policy order_read on "order" for select
  using (auth_role() in ('owner','manager','cashier','kitchen'));

create policy order_kitchen_advance on "order" for update
  using  (auth_role() in ('owner','manager','cashier','kitchen'))
  with check (auth_role() in ('owner','manager','cashier','kitchen'));
```
> Kitchen role is constrained at the **RPC** layer to only move status forward (pending→cooking→ready→done),
> not edit money fields. Sensitive writes (payments) go through `security definer` functions with the
> service role, never direct table writes from the client.

---

## 5. Server logic — RPC & Edge Functions

### 5.1 `rpc place_order(payload jsonb) returns order` — **atomic**
`security definer`. In one transaction:
1. Insert `order` (status `pending`), generate `order_no` from a sequence.
2. Insert `order_item` rows with price snapshots; compute `subtotal`.
3. Resolve discount (from `discount` rule or inline), compute `discount_total`,
   `tax_total` (`store_settings.tax_rate_bps`), `service_total`, `grand_total`.
4. **Do not** decrement stock yet (stock moves on fulfillment/payment — configurable).
5. Return the order. Realtime broadcasts the insert → KDS picks it up.

### 5.2 `rpc advance_order_status(order_id uuid, to_status order_status)`
Validates the transition is forward and the caller's role may perform it. On `done`/`paid`
sets the matching timestamp. Kitchen role allowed for `cooking`/`ready`/`done` only.

### 5.3 `rpc consume_stock_for_order(order_id uuid)`
`security definer`. For each `order_item`, expand via `recipe_item` and insert negative
`stock_movement(type='sale')` rows (trigger updates `ingredient.current_stock`). Idempotent
per order (guard against double-consume). Called by `pay_order`/fulfillment.

### 5.4 `rpc adjust_stock(ingredient_id, qty_delta, type, reason)`
Single entry point for restock/adjust/waste; writes a `stock_movement`. `owner`/`manager` only.

### 5.5 Cash payment: `rpc pay_order_cash(order_id, amount, idempotency_key)`
Inserts a `settled` `payment` (provider `cash`), sets order `paid` + `paid_at`,
calls `consume_stock_for_order`. Idempotent on `idempotency_key`.

### 5.6 Edge Function `payments-midtrans-charge`
- Input: `order_id`, `method`, `idempotency_key` (from authed client).
- Loads order server-side, recomputes amount (never trusts client amount).
- Creates a `payment` row (`pending`) + calls **Midtrans Core/Snap API** with server key.
- Returns the QRIS string / Snap token / redirect to the client. **No card data on the client.**

### 5.7 Edge Function `payments-midtrans-webhook`
- Verifies the Midtrans **signature** (`sha512(order_id+status_code+gross_amount+server_key)`).
- Maps Midtrans status → `payment_status`; on `settlement`/`capture` → mark `payment` settled,
  set order `paid`, call `consume_stock_for_order`. Writes `raw_payload`.
- Idempotent on `provider_ref`.

### 5.8 Edge Function `generate-receipt`
Renders a receipt (HTML/ESC-POS) from `order` + `receipt_config`; used by reprint/view.
Auto-print routes to a `device` of type `printer` when `receipt_config.auto_print`.

### 5.9 Scheduled (pg_cron)
- Nightly **daily-sales rollup** → refresh materialized views (§7).
- (P3) forecasting + insight-generation jobs.

---

## 6. Realtime channels

| Channel | Source | Consumer |
|---|---|---|
| KDS queue | `order` (insert/`status` update) + `order_item.station_status` | Kitchen page board (replaces the 1s `setTick` polling) |
| Notifications | `notification` table inserts (per recipient) | Topbar bell unread count + Notifications page |
| Inventory alerts | `ingredient` crossing `min_stock` (trigger → notification) | Dashboard alerts + Notifications |

---

## 7. Analytics (derived — views & rollups)

All P1 analytics are aggregations over `order`/`order_item`/`payment` in **WIB**:

- `v_daily_sales` — revenue per day (`grand_total` of `paid` orders), current vs previous period → Dashboard revenue chart, Orders stat chips.
- `v_top_products` — `sum(qty)`, `sum(line_total)` grouped by `menu_item` → Dashboard top menu, Analytics top performers, Menu `sold_today`.
- `v_peak_hours` — order counts `GROUP BY hour [, dow]` → Dashboard peak-hours bar + Analytics hour×day heatmap. *(This is plain aggregation — not AI.)*
- `v_payment_mix`, `v_category_breakdown` — for Analytics donut/payment cards.

Heavy ones become **materialized views** refreshed by pg_cron; light ones are plain views.

---

## 8. Cross-cutting requirements

- **Money/tax:** integer IDR; server computes subtotal/discount/tax/service; rounding rules centralized in `place_order`. Rates from `store_settings` (`*_bps`).
- **Timezone:** store `timestamptz`; all "today"/daily logic converts to `Asia/Jakarta`.
- **Orders querying:** server-side **pagination + filter (status) + search (order_no/table) + sort** via PostgREST query params or an `rpc list_orders`. The Orders page must stop filtering client-side.
- **Idempotency:** every payment path requires a client `idempotency_key`; unique-constrained.
- **Transactional integrity:** order/payment/stock mutations only via the RPCs above (never multi-call from the client).
- **Audit log:** definer triggers/functions write `audit_log` on sensitive changes.
- **Storage buckets:** `logos` (store/receipt), `menu-images` (public read, role-gated write).

---

## 9. Phase 2 additions (sketch)

| Area | New tables / changes |
|---|---|
| **KDS board** | `order_item.station_status`, `station` table; Realtime + bump/recall RPCs. |
| **Table Management** | `restaurant_table (id, label, seats, status)`; `order.table_id` FK (supersedes `table_label`); merge/split RPCs. |
| **Customer** *(prereq for Loyalty)* | `customer (id, name, phone, email, tags)`; `order.customer_id`; powers "Repeat customers" KPI. |
| **Customer Loyalty** | `loyalty_account (customer_id, points, tier)`, `loyalty_txn`; earn/redeem RPCs. |
| **Supplier Management** | `supplier (id, name, contact, terms)`. |
| **Purchase Orders** | `purchase_order`, `po_item`; receiving writes `stock_movement(type='restock')`. (Inventory "Restock" button → create PO.) |
| **Notifications/Alerts service** *(gap)* | `notification (id, recipient_id, type, category, title, body, action_url, is_read, created_at)`, `notification_pref (user_id, in_app, email, sms, push, quiet_from, quiet_to)`; dispatch Edge Function (email/SMS/push), event producers (inventory threshold, order events, insights). |
| **Devices / Integrations** | already in §3.11; P2 wires real printer/terminal/webhook flows. |
| **Multi-branch operations** | re-introduce `branch_id` on scoped tables + a `branch` table + branch predicate in RLS; branch switcher + consolidated reporting. *(The reversible assumption from §1.)* |

## 10. Phase 3 additions (sketch)

| Area | Approach |
|---|---|
| **Forecasting** *(merges Sales Prediction + Inventory Prediction + Demand Forecasting)* | Scheduled Edge Function / external ML reads history, writes `forecast (target, horizon, value, generated_at)`. Two outputs: sales (revenue/covers) and ingredient demand. |
| **AI Insights Engine** | `insight (id, category, headline, detail, confidence, trend, created_at)`; Edge Function (LLM/rules) generates rows → surfaced on Dashboard + Notifications. "Ask AI" = on-demand Edge Function. |
| **Staff Recommendation** | Derived from `v_peak_hours` + labor rules → an insight ("staff +2 crew"). |
| **Menu Engineering** | Margin × popularity classification (stars/dogs) over `v_top_products` + ingredient cost from `recipe_item`. *(Basic top/bottom sellers already in P1 analytics.)* |

---

## 11. Revised roadmap & build order

**P1 (MVP):** Auth + roles/RLS → Categories/Menu → Ingredients + **Recipe/BOM** → Orders **(incl. status lifecycle)** → Payments (cash + **Midtrans**) → Receipts + **Settings/Config persistence** → Analytics views (daily sales, top products, basic peak-hours). *(+ login/logout UI in the frontend.)*

**P2:** Realtime KDS board · Table Management · **Customer** → Loyalty · Supplier · Purchase Orders · **Notifications/Alerts service** · Devices & Integrations · (optional) Multi-branch.

**P3:** **Forecasting** (merged) · AI Insights Engine · Staff Recommendation · Menu Engineering.

---

## 12. Verification

1. **UI-to-process trace:** for each of the 9 pages, every button/form/toggle maps to a table/RPC/Edge Function here (spot-check Cashier charge → `place_order`+`payments-midtrans-charge`; Inventory restock/history → `adjust_stock`+`stock_movement`; Kitchen status → `advance_order_status`; Settings save → config tables; Notifications channels → `notification_pref`).
2. **Schema dry-run:** `supabase start`, apply P1 migration, seed from the current `src/pages/*` mock arrays, confirm each page can be served read/write by role.
3. **RLS by role:** sign in as each role and assert: cashier can't read Settings/Team; kitchen sees only the KDS queue + status updates; manager can't touch billing/role changes.
4. **Payments:** sandbox Midtrans charge → webhook → order `paid` + stock consumed; replay webhook to confirm idempotency.
5. **No orphan UI:** after wiring each entity, re-grep for hardcoded arrays in `src/pages/`; pages should source from Supabase, not constants.
