-- Rollback for migration 0006: retail schema
-- Run this if migration 0006 needs to be reverted.
-- Safe: all objects created in 0006 are NEW tables/types — no existing data is touched.

-- Drop triggers
drop trigger if exists set_updated_at_transaction       on public.transaction;
drop trigger if exists set_updated_at_inventory         on public.inventory;
drop trigger if exists set_updated_at_product           on public.product;
drop trigger if exists set_updated_at_product_category  on public.product_category;

-- Drop tables (in FK-safe order: children before parents)
drop table if exists public.transaction_item   cascade;
drop table if exists public.transaction        cascade;
drop table if exists public.inventory_movement cascade;
drop table if exists public.inventory          cascade;
drop table if exists public.product            cascade;
drop table if exists public.product_category   cascade;

-- Drop types
drop type if exists public.transaction_status       cascade;
drop type if exists public.inventory_movement_kind  cascade;

-- Restore soft-deprecation comments on legacy tables
comment on table public.category   is null;
comment on table public.menu_item  is null;
comment on table public.ingredient is null;

-- Note: set_updated_at() function is NOT dropped here as it may be reused.
-- If no other triggers use it, it can be dropped manually:
-- drop function if exists public.set_updated_at();
