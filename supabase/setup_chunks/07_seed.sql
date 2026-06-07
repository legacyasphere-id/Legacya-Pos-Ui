-- ===== CHUNK 7 of 7 =====
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
