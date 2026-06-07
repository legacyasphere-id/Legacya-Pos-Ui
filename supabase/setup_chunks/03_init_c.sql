-- ===== CHUNK 3 of 7 =====
-- ---------------------------------------------------------------------------
-- Settings / configuration
-- ---------------------------------------------------------------------------
create table public.store_settings (
  id                serial primary key,
  singleton         boolean not null default true unique check (singleton),  -- enforce one row
  business_name     text,
  handle            text,
  address           text,
  phone             text,
  email             text,
  website           text,
  opens_at          text,
  closes_at         text,
  currency          text not null default 'IDR',
  tax_rate_bps      int not null default 1000,         -- 10.00%
  service_charge_bps int not null default 0,
  logo_url          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.payment_method_config (
  method      text primary key check (method in ('qris','card','cash','ewallet','bank_transfer')),
  is_enabled  boolean not null default true,
  fee_bps     int not null default 0,
  description text,
  updated_at  timestamptz not null default now()
);

create table public.receipt_config (
  id            serial primary key,
  singleton     boolean not null default true unique check (singleton),
  header_line_1 text,
  header_line_2 text,
  footer        text,
  show_logo     boolean not null default true,
  show_tax      boolean not null default true,
  show_qr       boolean not null default false,
  auto_print    boolean not null default false,
  updated_at    timestamptz not null default now()
);

create table public.device (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text not null check (type in ('printer','terminal')),
  connection  text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.integration (
  id         uuid primary key default gen_random_uuid(),
  provider   text not null,
  status     text not null default 'disconnected',
  config     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- audit_log
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references public.profiles (id),
  action     text not null,
  entity     text not null,
  entity_id  text,
  diff       jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','category','menu_item','ingredient','order',
    'store_settings','receipt_config','integration'
  ] loop
    execute format(
      'create trigger trg_moddatetime_%1$s before update on public.%2$I
         for each row execute function extensions.moddatetime(updated_at);',
      replace(t,'"',''), t);
  end loop;
end;
$$;
