# LegacyaPOS — Supabase backend (Phase 1 scaffold)

Validated P1 backend: schema, RLS (dev baseline), server-side RPCs, seed data, and
Midtrans Edge Functions. Spec: [`docs/backend-requirements.md`](../docs/backend-requirements.md).

```
supabase/
├── config.toml                         # local stack config
├── migrations/
│   ├── 20250101000000_p1_init.sql      # extensions, enums, tables, triggers, auth_role()
│   ├── 20250101000001_p1_rls.sql       # RLS Step 1: authenticated baseline
│   └── 20250101000002_p1_functions.sql # RPCs: place_order, pay_order_cash, adjust_stock, …
├── seed.sql                            # catalog + settings + demo orders (from the UI mocks)
└── functions/
    ├── payments-midtrans-charge/       # create Snap transaction (server-side amount)
    └── payments-midtrans-webhook/      # verify signature, settle, consume stock
```

> Already validated against Postgres 16 (migrations apply cleanly; place_order math,
> discounts, cash payment + BOM stock decrement, idempotency, and RLS all pass).

---

## ▶️ Your turn — bring it up

**1. Install the Supabase CLI** — https://supabase.com/docs/guides/cli (`brew install supabase/tap/supabase`, scoop, or npx).

**2. Start the local stack** (needs Docker running):
```bash
supabase start          # boots Postgres + Auth + Studio + Edge runtime
supabase db reset        # applies migrations + seed.sql
```
`supabase status` prints your local **API URL** and **anon key**.

**3. Wire the frontend env:**
```bash
cp .env.example .env
# paste VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from `supabase status`
```

**4. Create the first user + make them `owner`** (Studio → Auth → Add user, or the API),
then in Studio SQL editor:
```sql
update public.profiles set role = 'owner' where email = 'you@example.com';
```
(The `on_auth_user_created` trigger auto-creates the `profiles` row on signup.)

**5. Midtrans (sandbox)** — get **Server Key** + **Client Key** from the Midtrans dashboard, then:
```bash
supabase secrets set MIDTRANS_SERVER_KEY=SB-Mid-server-xxx MIDTRANS_IS_PRODUCTION=false
supabase functions deploy payments-midtrans-charge
supabase functions deploy payments-midtrans-webhook --no-verify-jwt
```
Set the **Payment Notification URL** in Midtrans → Settings → Configuration to your deployed
`payments-midtrans-webhook` URL. `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically for deployed functions.

**6. (Cloud) deploy the DB:** `supabase link --project-ref <ref>` then `supabase db push`.

---

## Decisions baked in
- **Single location** — no `branch_id`. Re-introducing it is the documented path to P2 multi-branch.
- **RLS Step 1 (dev):** authenticated users broadly allowed; `payment`/`stock_movement`/`audit_log`
  are read-only (writes via `security definer` RPCs). **Tighten to the per-role matrix
  (docs §4) before production.**
- **Money:** integer Rupiah. **Percentages:** basis points (1000 = 10%). **Timezone:** Asia/Jakarta.
- **Payments:** Midtrans, server-side only — card/QRIS data never touches the client.

## Key RPCs (call from the frontend via `supabase.rpc(...)`)
| RPC | Purpose |
|---|---|
| `place_order(payload jsonb)` | Create order + items, compute discount/tax/total. |
| `advance_order_status(order_id, to_status)` | Move order through the lifecycle (kitchen-gated). |
| `pay_order_cash(order_id, amount, idempotency_key)` | Cash payment → mark paid → consume stock. |
| `adjust_stock(ingredient_id, qty_delta, type, reason)` | Restock / adjust / waste. |
| `consume_stock_for_order(order_id)` | Expand BOM → stock movements (idempotent). |

## Not yet done (next steps)
- Wire the React pages to Supabase (replace the mock arrays in `src/pages/*`), page by page.
- Analytics **views** (`v_daily_sales`, `v_top_products`, `v_peak_hours`) + pg_cron rollups.
- Login/logout UI + route guards.
- Phase 2/3 tables (Customer, Notifications service, Suppliers/POs, Forecasting) per the spec.
