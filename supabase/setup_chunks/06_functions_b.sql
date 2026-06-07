-- ===== CHUNK 6 of 7 =====
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
