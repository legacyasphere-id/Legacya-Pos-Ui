-- ===== CHUNK 4 of 7 =====
-- ============================================================================
-- LegacyaPOS — P1 RLS (Step 1: development baseline)
-- Enable RLS everywhere. Authenticated users are broadly allowed so feature
-- work isn't blocked; anon has no access. payment / stock_movement / audit_log
-- are READ-ONLY for authenticated — writes happen only through the
-- security-definer RPCs (which bypass RLS). Tighten to the per-role matrix
-- (docs §4) before production.
-- ============================================================================

-- Schema + privilege grants (RLS still gates rows).
grant usage on schema public to anon, authenticated;
grant all on all tables    in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

-- Tables that authenticated users may fully read/write in dev.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','category','menu_item','ingredient','recipe_item','discount',
    'order','order_item','store_settings','payment_method_config',
    'receipt_config','device','integration'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy dev_authenticated_all on public.%I
         for all to authenticated using (true) with check (true);', t);
  end loop;
end;
$$;

-- Read-only tables: select for authenticated, writes only via definer RPCs.
do $$
declare t text;
begin
  foreach t in array array['payment','stock_movement','audit_log'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy dev_authenticated_read on public.%I
         for select to authenticated using (true);', t);
  end loop;
end;
$$;
