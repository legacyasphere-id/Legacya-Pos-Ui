-- ============================================================================
-- Fix auth_role(): read the app role from profiles only.
-- The previous version read auth.jwt()->>'role', but in Supabase that claim is
-- the Postgres role (e.g. 'authenticated'), which is not a valid app_role and
-- broke place_order/pay_order_cash with "invalid input value for enum app_role".
-- ============================================================================
create or replace function public.auth_role()
returns app_role
language sql
stable
security definer
set search_path = public, auth
as $$
  select role from public.profiles where id = auth.uid();
$$;
