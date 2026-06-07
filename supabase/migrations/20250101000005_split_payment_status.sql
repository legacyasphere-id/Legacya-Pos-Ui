-- ============================================================================
-- Split payment from fulfillment.
-- order.status now means KITCHEN/FULFILLMENT progress only
-- (pending -> cooking -> ready -> done). Payment is tracked separately on
-- order.payment_status, so every order (cash included) flows through the
-- kitchen instead of jumping straight to "paid".
-- Idempotent: safe to run on the already-provisioned database.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_payment_status') then
    create type order_payment_status as enum ('unpaid', 'paid', 'refunded', 'void');
  end if;
end
$$;

alter table public."order"
  add column if not exists payment_status order_payment_status not null default 'unpaid';

-- Backfill existing data: orders previously marked status='paid' are paid; move
-- their fulfillment status to 'done' (served).
update public."order" set payment_status = 'paid'
 where status = 'paid' and payment_status = 'unpaid';
update public."order" set status = 'done'
 where status = 'paid';

-- pay_order_cash now records payment on payment_status and leaves the kitchen
-- (fulfillment) status untouched, so the order stays in the kitchen queue.
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

  update public."order" set payment_status = 'paid', paid_at = now() where id = p_order_id;
  perform public.consume_stock_for_order(p_order_id);

  return v_pay;
end;
$$;
