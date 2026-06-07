-- ===== CHUNK 5 of 7 =====
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
