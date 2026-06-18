# ROLLBACK_PLAN.md
## Legacya POS — Migration 0006 Rollback Procedure
**Supabase Project:** `dlizxnlwhnbargobvzmi` (Legacya-Pos-Ui)
**Migration:** 0006 — Restaurant to Retail Transition
**Rollback Author:** Claude — Sphere Method v2.1
**Date:** 2026-06-18
**Status:** READY — Execute only if Migration 0006 fails or produces data loss

> **When to use this plan:** Execute this rollback if Migration 0006 produces errors, unexpected data loss, application breakage, or any unintended state. The goal is to restore the database to its exact pre-migration state as documented in DATABASE_BACKUP_PLAN.md.

---

## 1. Rollback Decision Criteria

Trigger a rollback if ANY of the following occur during or after Migration 0006:

| Trigger | Action |
|---|---|
| A DROP TABLE or ALTER TYPE fails mid-migration | Immediate rollback |
| Application returns 500 errors after migration | Rollback within 30 minutes |
| Data count mismatch on order or payment tables | Immediate rollback |
| place_order or pay_order_cash RPC fails | Rollback within 1 hour |
| RLS policy blocks owner from accessing their own data | Immediate rollback |
| Any live transaction cannot be completed | Immediate rollback |

---

## 2. Pre-Rollback Checklist

Before executing the rollback SQL:

1. **Pause all application traffic** — set Vercel deployment to maintenance mode or unpublish
2. **Export current state** — run `SELECT COUNT(*) FROM public."order";` to capture row count
3. **Note the time** — log rollback start time for audit purposes
4. **Do not run rollback in pieces** — execute the full rollback script as a single transaction

---

## 3. Full Rollback SQL Script

Copy and execute the entire script below in the Supabase SQL Editor for project `dlizxnlwhnbargobvzmi`.

> Execute as a single transaction. If any statement fails, the entire rollback aborts automatically (no partial state).

```sql
-- ============================================================
-- LEGACYA POS — MIGRATION 0006 ROLLBACK SCRIPT
-- Execute in: Supabase SQL Editor (project: dlizxnlwhnbargobvzmi)
-- DO NOT execute in pieces — run as one complete block
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 1: Drop any new retail tables added by Migration 0006
-- (Only exists if migration partially ran)
-- ============================================================
DROP TABLE IF EXISTS public.product CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.customer CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.inventory_movement CASCADE;
DROP TABLE IF EXISTS public.inventory_movements CASCADE;

-- ============================================================
-- STEP 2: Restore columns dropped from public."order"
-- (If migration dropped table_label, customer_type, etc.)
-- ============================================================
ALTER TABLE public."order"
  ADD COLUMN IF NOT EXISTS table_label    text,
  ADD COLUMN IF NOT EXISTS customer_type  text NOT NULL DEFAULT 'dine_in',
  ADD COLUMN IF NOT EXISTS cooking_at     timestamptz,
  ADD COLUMN IF NOT EXISTS ready_at       timestamptz,
  ADD COLUMN IF NOT EXISTS done_at        timestamptz;

-- ============================================================
-- STEP 3: Restore station_status on order_item
-- (If migration dropped this column)
-- ============================================================
ALTER TABLE public.order_item
  ADD COLUMN IF NOT EXISTS station_status text NOT NULL DEFAULT 'queued';

-- ============================================================
-- STEP 4: Restore menu_item if dropped
-- ============================================================
CREATE TABLE IF NOT EXISTS public.menu_item (
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

-- ============================================================
-- STEP 5: Restore ingredient if dropped
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ingredient (
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

-- ============================================================
-- STEP 6: Restore recipe_item if dropped
-- ============================================================
CREATE TABLE IF NOT EXISTS public.recipe_item (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id  uuid NOT NULL REFERENCES public.menu_item(id),
  ingredient_id uuid NOT NULL REFERENCES public.ingredient(id),
  qty_per_unit  numeric NOT NULL
);

-- ============================================================
-- STEP 7: Restore enums to pre-migration state
-- ============================================================

-- Restore app_role: ensure 'kitchen' value exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'kitchen'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'kitchen';
  END IF;
END$$;

-- Restore order_status: check for restaurant-specific values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'order_status' AND e.enumlabel = 'cooking'
  ) THEN
    RAISE NOTICE 'order_status enum is missing cooking value — manual intervention required. See Section 4.';
  END IF;
END$$;

-- ============================================================
-- STEP 8: Restore RPCs dropped by Migration 0006
-- ============================================================

-- Restore advance_order_status
CREATE OR REPLACE FUNCTION public.advance_order_status(p_order_id uuid)
RETURNS public."order"
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order public."order";
  v_next_status public.order_status;
BEGIN
  SELECT * INTO v_order FROM public."order" WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  v_next_status := CASE v_order.status
    WHEN 'pending' THEN 'cooking'::public.order_status
    WHEN 'cooking' THEN 'ready'::public.order_status
    WHEN 'ready'   THEN 'done'::public.order_status
    ELSE NULL
  END;

  IF v_next_status IS NULL THEN
    RAISE EXCEPTION 'Cannot advance order in status %', v_order.status;
  END IF;

  UPDATE public."order"
  SET
    status     = v_next_status,
    cooking_at = CASE WHEN v_next_status = 'cooking' THEN now() ELSE cooking_at END,
    ready_at   = CASE WHEN v_next_status = 'ready'   THEN now() ELSE ready_at   END,
    done_at    = CASE WHEN v_next_status = 'done'    THEN now() ELSE done_at    END,
    updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

-- Restore consume_stock_for_order
CREATE OR REPLACE FUNCTION public.consume_stock_for_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
BEGIN
  FOR v_item IN
    SELECT oi.qty, ri.ingredient_id, ri.qty_per_unit
    FROM public.order_item oi
    JOIN public.recipe_item ri ON ri.menu_item_id = oi.menu_item_id
    WHERE oi.order_id = p_order_id
  LOOP
    UPDATE public.ingredient
    SET current_stock = current_stock - (v_item.qty * v_item.qty_per_unit),
        updated_at    = now()
    WHERE id = v_item.ingredient_id;

    INSERT INTO public.stock_movement (ingredient_id, type, qty_delta, ref_order_id)
    VALUES (v_item.ingredient_id, 'sale', -(v_item.qty * v_item.qty_per_unit), p_order_id);
  END LOOP;
END;
$$;

-- ============================================================
-- STEP 9: Re-seed menu_item data
-- ============================================================
INSERT INTO public.menu_item (id, category_id, name, price, emoji, is_available, sort_order)
SELECT id, category_id, name, price, emoji, is_available, sort_order FROM (VALUES
  ('e739d07d-2a4a-4e12-a37f-b261af73fa04'::uuid, '7949846b-b4c5-4ca3-9d34-4d62b0a5e03b'::uuid, 'Chicken Mentai Bowl',  65000::bigint, null, true, 1),
  ('fabcd78d-fc40-4ece-a2c3-ad84e7a42e55'::uuid, '7949846b-b4c5-4ca3-9d34-4d62b0a5e03b'::uuid, 'Salmon Aburi',         72000::bigint, null, true, 2),
  ('d65665b6-e5e0-4e6d-930c-3e8a3cf461ed'::uuid, '7949846b-b4c5-4ca3-9d34-4d62b0a5e03b'::uuid, 'Ramen Tonkotsu',       58000::bigint, null, true, 3),
  ('1a3c1f25-3c6a-4f01-a4d3-1c9e4d8e6123'::uuid, '7949846b-b4c5-4ca3-9d34-4d62b0a5e03b'::uuid, 'Beef Yakiniku Bowl',   75000::bigint, null, true, 4),
  ('22150445-87c6-4b10-be8e-d0c7c0c4d3e1'::uuid, 'bb281f3a-1e50-4765-b5ed-e6b826df3898'::uuid, 'Dragon Roll',          85000::bigint, null, true, 1),
  ('b3f4a5c6-d7e8-4901-2345-678901234567'::uuid, 'bb281f3a-1e50-4765-b5ed-e6b826df3898'::uuid, 'Spicy Tuna Roll',      78000::bigint, null, true, 2),
  ('c4e5b6d7-e8f9-4012-3456-789012345678'::uuid, 'bb281f3a-1e50-4765-b5ed-e6b826df3898'::uuid, 'Rainbow Roll',         92000::bigint, null, true, 3),
  ('d5f6c7e8-f901-4123-4567-890123456789'::uuid, 'bb281f3a-1e50-4765-b5ed-e6b826df3898'::uuid, 'Salmon Mentai Roll',   88000::bigint, null, true, 4),
  ('e6a7d8f9-0112-4234-5678-901234567890'::uuid, '256ed4b6-4d5c-41a4-a59f-b61d63b6c29f'::uuid, 'Beef Teriyaki',        82000::bigint, null, true, 1),
  ('f7b8e9a0-1223-4345-6789-012345678901'::uuid, '256ed4b6-4d5c-41a4-a59f-b61d63b6c29f'::uuid, 'Salmon Teriyaki',      88000::bigint, null, true, 2),
  ('a8c9f0b1-2334-4456-7890-123456789012'::uuid, '256ed4b6-4d5c-41a4-a59f-b61d63b6c29f'::uuid, 'Chicken Karaage',      68000::bigint, null, true, 3),
  ('b9d0a1c2-3445-4567-8901-234567890123'::uuid, '256ed4b6-4d5c-41a4-a59f-b61d63b6c29f'::uuid, 'Salmon Mentai Bowl',   76000::bigint, null, true, 4),
  ('c0e1b2d3-4556-4678-9012-345678901234'::uuid, '64dedaf4-e6c2-4f20-a2f3-0dff2491a98c'::uuid, 'Iced Matcha Latte',    38000::bigint, null, true, 1),
  ('d1f2c3e4-5667-4789-0123-456789012345'::uuid, '64dedaf4-e6c2-4f20-a2f3-0dff2491a98c'::uuid, 'Yuzu Lemonade',        32000::bigint, null, true, 2),
  ('e2a3d4f5-6778-4890-1234-567890123456'::uuid, '64dedaf4-e6c2-4f20-a2f3-0dff2491a98c'::uuid, 'Hot Matcha',           28000::bigint, null, true, 3),
  ('f3b4e5a6-7889-4901-2345-678901234567'::uuid, '64dedaf4-e6c2-4f20-a2f3-0dff2491a98c'::uuid, 'Mineral Water',        10000::bigint, null, true, 4)
) AS v(id, category_id, name, price, emoji, is_available, sort_order)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 10: Re-seed ingredient data
-- ============================================================
INSERT INTO public.ingredient (id, name, category, unit, current_stock, min_stock)
SELECT id, name, category, unit, current_stock, min_stock FROM (VALUES
  ('161e565b-5d8f-4e19-9a67-d7f0c7c9e2a1'::uuid, 'Beef Sirloin',      'Protein',  'kg',  5.0::numeric,   2.0::numeric),
  ('f4431b73-2c9d-4b88-a761-c3e5d6f7a8b9'::uuid, 'Burger Bun',        'Bread',    'pcs', 50.0::numeric,  20.0::numeric),
  ('8b6b5fe9-1a2b-4c3d-8e4f-5a6b7c8d9e0f'::uuid, 'Chicken Thigh',     'Protein',  'kg',  8.0::numeric,   3.0::numeric),
  ('975da2bf-3b4c-4d5e-9f0a-1b2c3d4e5f6a'::uuid, 'Matcha Powder',     'Beverage', 'g',   500.0::numeric, 100.0::numeric),
  ('21e21356-4c5d-4e6f-0a1b-2c3d4e5f6a7b'::uuid, 'Mozzarella Cheese', 'Dairy',    'kg',  3.0::numeric,   1.0::numeric),
  ('c547f2f4-5d6e-4f7a-1b2c-3d4e5f6a7b8c'::uuid, 'Ramen Noodles',     'Carbs',    'pcs', 30.0::numeric,  10.0::numeric),
  ('78d5b932-6e7f-4a8b-2c3d-4e5f6a7b8c9d'::uuid, 'Salmon Fillet',     'Protein',  'kg',  4.0::numeric,   1.5::numeric),
  ('885de718-7f8a-4b9c-3d4e-5f6a7b8c9d0e'::uuid, 'Sushi Rice',        'Carbs',    'kg',  10.0::numeric,  3.0::numeric)
) AS v(id, name, category, unit, current_stock, min_stock)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 11: Re-seed recipe_item data
-- ============================================================
INSERT INTO public.recipe_item (id, menu_item_id, ingredient_id, qty_per_unit)
SELECT id, menu_item_id, ingredient_id, qty_per_unit FROM (VALUES
  ('a1b2c3d4-e5f6-4789-0123-456789abcdef'::uuid, '1a3c1f25-3c6a-4f01-a4d3-1c9e4d8e6123'::uuid, '161e565b-5d8f-4e19-9a67-d7f0c7c9e2a1'::uuid, 0.220::numeric),
  ('b2c3d4e5-f6a7-4890-1234-567890abcdef'::uuid, 'e739d07d-2a4a-4e12-a37f-b261af73fa04'::uuid, '8b6b5fe9-1a2b-4c3d-8e4f-5a6b7c8d9e0f'::uuid, 0.200::numeric),
  ('c3d4e5f6-a7b8-4901-2345-678901abcdef'::uuid, 'e739d07d-2a4a-4e12-a37f-b261af73fa04'::uuid, '885de718-7f8a-4b9c-3d4e-5f6a7b8c9d0e'::uuid, 0.180::numeric),
  ('d4e5f6a7-b8c9-4012-3456-789012abcdef'::uuid, 'c0e1b2d3-4556-4678-9012-345678901234'::uuid, '975da2bf-3b4c-4d5e-9f0a-1b2c3d4e5f6a'::uuid, 6.000::numeric),
  ('e5f6a7b8-c9d0-4123-4567-890123abcdef'::uuid, 'd65665b6-e5e0-4e6d-930c-3e8a3cf461ed'::uuid, 'c547f2f4-5d6e-4f7a-1b2c-3d4e5f6a7b8c'::uuid, 1.000::numeric),
  ('f6a7b8c9-d0e1-4234-5678-901234abcdef'::uuid, 'fabcd78d-fc40-4ece-a2c3-ad84e7a42e55'::uuid, '78d5b932-6e7f-4a8b-2c3d-4e5f6a7b8c9d'::uuid, 0.120::numeric)
) AS v(id, menu_item_id, ingredient_id, qty_per_unit)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 12: Restore store_settings to pre-migration values
-- ============================================================
INSERT INTO public.store_settings (id, singleton, business_name, handle, address, phone, email, website, opens_at, closes_at, currency, tax_rate_bps, service_charge_bps, logo_url)
VALUES (1, true, 'Legacya Kitchen', '@legacya', 'Jl. Kemang Raya No. 1, Jakarta', '+62 811 0000', 'hello@legacya.co', 'legacya.co', '10:00', '22:00', 'IDR', 1000, 0, null)
ON CONFLICT (id) DO UPDATE SET
  business_name      = EXCLUDED.business_name,
  handle             = EXCLUDED.handle,
  address            = EXCLUDED.address,
  phone              = EXCLUDED.phone,
  email              = EXCLUDED.email,
  website            = EXCLUDED.website,
  opens_at           = EXCLUDED.opens_at,
  closes_at          = EXCLUDED.closes_at,
  tax_rate_bps       = EXCLUDED.tax_rate_bps,
  service_charge_bps = EXCLUDED.service_charge_bps;

-- ============================================================
-- STEP 13: Restore receipt_config to pre-migration values
-- ============================================================
INSERT INTO public.receipt_config (id, singleton, header_line_1, header_line_2, footer, show_logo, show_tax, show_qr, auto_print)
VALUES (1, true, 'Legacya Kitchen', 'Cabang Kemang', 'Thank you! See you again.', true, true, false, false)
ON CONFLICT (id) DO UPDATE SET
  header_line_1 = EXCLUDED.header_line_1,
  header_line_2 = EXCLUDED.header_line_2,
  footer        = EXCLUDED.footer,
  show_logo     = EXCLUDED.show_logo,
  show_tax      = EXCLUDED.show_tax;

-- ============================================================
-- STEP 14: Restore payment_method_config
-- ============================================================
INSERT INTO public.payment_method_config (method, is_enabled, fee_bps, description)
VALUES
  ('bank_transfer', false, 0,   'Manual transfer verification'),
  ('card',          true,  250, 'Visa, Mastercard, JCB via card terminal'),
  ('cash',          true,  0,   'Physical cash with change calculator'),
  ('ewallet',       true,  150, 'GoPay, OVO, DANA direct integration'),
  ('qris',          true,  70,  'All Indonesian e-wallet and bank QR')
ON CONFLICT (method) DO UPDATE SET
  is_enabled  = EXCLUDED.is_enabled,
  fee_bps     = EXCLUDED.fee_bps,
  description = EXCLUDED.description;

-- ============================================================
-- STEP 15: Verification
-- ============================================================
DO $$
DECLARE
  v_category_count     integer;
  v_menu_item_count    integer;
  v_ingredient_count   integer;
  v_recipe_item_count  integer;
  v_order_count        integer;
  v_payment_count      integer;
BEGIN
  SELECT COUNT(*) INTO v_category_count    FROM public.category;
  SELECT COUNT(*) INTO v_menu_item_count   FROM public.menu_item;
  SELECT COUNT(*) INTO v_ingredient_count  FROM public.ingredient;
  SELECT COUNT(*) INTO v_recipe_item_count FROM public.recipe_item;
  SELECT COUNT(*) INTO v_order_count       FROM public."order";
  SELECT COUNT(*) INTO v_payment_count     FROM public.payment;

  ASSERT v_category_count    >= 4,  'ROLLBACK VERIFICATION FAILED: category count < 4';
  ASSERT v_menu_item_count   >= 16, 'ROLLBACK VERIFICATION FAILED: menu_item count < 16';
  ASSERT v_ingredient_count  >= 8,  'ROLLBACK VERIFICATION FAILED: ingredient count < 8';
  ASSERT v_recipe_item_count >= 6,  'ROLLBACK VERIFICATION FAILED: recipe_item count < 6';
  ASSERT v_order_count       >= 6,  'ROLLBACK VERIFICATION FAILED: order count < 6';
  ASSERT v_payment_count     >= 4,  'ROLLBACK VERIFICATION FAILED: payment count < 4';

  RAISE NOTICE 'ROLLBACK VERIFICATION PASSED: category=%, menu_item=%, ingredient=%, recipe_item=%, order=%, payment=%',
    v_category_count, v_menu_item_count, v_ingredient_count, v_recipe_item_count, v_order_count, v_payment_count;
END$$;

COMMIT;

-- ============================================================
-- END OF ROLLBACK SCRIPT
-- If COMMIT succeeds, rollback is complete.
-- ============================================================
```

---

## 4. Manual Intervention Cases

### 4.1 If order_status enum was completely replaced
PostgreSQL cannot remove enum values once added. If Migration 0006 used DROP TYPE CASCADE + CREATE TYPE, the order table was also dropped. In this case:

1. Execute the rollback script above (restores tables and data)
2. Manually verify all 6 orders: `SELECT order_no, status FROM public."order" ORDER BY order_no;`
3. Expected: ORD-1001 (done), ORD-1002 (done), ORD-1003 (done), ORD-1004 (pending), ORD-1005 (pending), ORD-1006 (pending)

### 4.2 If auth trigger was affected
If the handle_new_user trigger was dropped:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4.3 If place_order RPC signature changed incompatibly
The frontend calls place_order with a specific payload. If the RPC was modified and the frontend is broken:
1. Revert the frontend code to the pre-Migration 0006 version via git revert
2. Or restore the original RPC signature from supabase/p1_setup_all.sql in the repository

---

## 5. Post-Rollback Verification Steps

```sql
-- 1. Row counts
SELECT 'category'   AS tbl, COUNT(*) FROM public.category
UNION ALL SELECT 'menu_item',    COUNT(*) FROM public.menu_item
UNION ALL SELECT 'ingredient',   COUNT(*) FROM public.ingredient
UNION ALL SELECT 'recipe_item',  COUNT(*) FROM public.recipe_item
UNION ALL SELECT 'order',        COUNT(*) FROM public."order"
UNION ALL SELECT 'order_item',   COUNT(*) FROM public.order_item
UNION ALL SELECT 'payment',      COUNT(*) FROM public.payment;

-- Expected: category=4, menu_item=16, ingredient=8, recipe_item=6, order=6, order_item=10, payment=4
```

```sql
-- 2. Real transaction integrity (ORD-1004 = Rp 74,800 cash)
SELECT o.order_no, o.grand_total, o.payment_status, p.method, p.amount
FROM public."order" o
JOIN public.payment p ON p.order_id = o.id
WHERE o.order_no = 'ORD-1004';
-- Expected: grand_total=74800, payment_status='paid', method='cash', amount=74800
```

```sql
-- 3. Enum values intact
SELECT typname, enumlabel FROM pg_enum e
JOIN pg_type t ON t.oid = e.enumtypid
WHERE typname IN ('app_role', 'order_status')
ORDER BY typname, enumsortorder;
-- Expected app_role: owner, manager, cashier, kitchen
-- Expected order_status: pending, cooking, ready, done, paid, void
```

```sql
-- 4. RPCs exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
-- Expected: advance_order_status, adjust_stock, apply_stock_movement,
--           auth_role, consume_stock_for_order, handle_new_user,
--           pay_order_cash, place_order
```

---

## 6. Rollback Time Estimate

| Phase | Estimated Time |
|---|---|
| Decision to rollback | less than 5 min |
| Pre-rollback checklist | less than 5 min |
| Execute rollback SQL | 1-3 min |
| Verification queries | 5 min |
| Application smoke test | 10 min |
| **Total** | **~25 min** |

---

## 7. Contact and Escalation

If the rollback script itself fails:
1. Do NOT run it again — it may create duplicate data
2. Check pg_stat_activity for locked transactions: `SELECT * FROM pg_stat_activity WHERE state = 'active';`
3. Open a Supabase support ticket with project ID `dlizxnlwhnbargobvzmi`
4. As a last resort: Supabase Dashboard -> Database -> Point-in-Time Recovery (if enabled on plan)

---

*Generated by Claude under the Sphere Method v2.1 — System Studio Framework*
*Legacya Sphere — Pre-Migration Safety Protocol*
*Project: dlizxnlwhnbargobvzmi (Legacya-Pos-Ui)*
