-- 0002 — plans
-- All limits live in plans.limits (jsonb) and are read at runtime.
-- NO LIMIT IS EVER HARDCODED IN APPLICATION CODE.

create table if not exists public.plans (
  id          uuid primary key default gen_random_uuid(),
  key         public.plan_key not null unique,
  name        text not null,
  description text,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  limits      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

create index if not exists plans_is_active_idx on public.plans (is_active);

-- Readable by any authenticated user (pricing display). Writable only by admins.
alter table public.plans enable row level security;

drop policy if exists plans_select_all on public.plans;
create policy plans_select_all on public.plans
  for select to authenticated using (true);

drop policy if exists plans_admin_write on public.plans;
create policy plans_admin_write on public.plans
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed — PLACEHOLDER VALUES, PENDING FINAL PRICING
--
-- Metrics per spec 12.9. `null` means unlimited.
-- Change these in the database, never in code.
-- ---------------------------------------------------------------------------

insert into public.plans (key, name, description, sort_order, limits) values
  ('trial', 'Trial', 'PLACEHOLDER — pending final pricing', 1, jsonb_build_object(
      'files_per_extraction', 5,
      'extractions_per_day', 3,
      'extractions_per_month', 3,
      'records_per_extraction', 500,
      'records_per_month', 500,
      'storage_bytes', 104857600,
      'exports_per_month', 5,
      'retention_days', 7
  )),
  ('starter', 'Starter', 'PLACEHOLDER — pending final pricing', 2, jsonb_build_object(
      'files_per_extraction', 25,
      'extractions_per_day', 10,
      'extractions_per_month', 30,
      'records_per_extraction', 5000,
      'records_per_month', 10000,
      'storage_bytes', 1073741824,
      'exports_per_month', 50,
      'retention_days', 90
  )),
  ('professional', 'Professional', 'PLACEHOLDER — pending final pricing', 3, jsonb_build_object(
      'files_per_extraction', 100,
      'extractions_per_day', 25,
      'extractions_per_month', 150,
      'records_per_extraction', 25000,
      'records_per_month', 75000,
      'storage_bytes', 10737418240,
      'exports_per_month', 500,
      'retention_days', 365
  )),
  ('agency', 'Agency', 'PLACEHOLDER — pending final pricing', 4, jsonb_build_object(
      'files_per_extraction', 250,
      'extractions_per_day', 100,
      'extractions_per_month', 500,
      'records_per_extraction', 100000,
      'records_per_month', 300000,
      'storage_bytes', 53687091200,
      'exports_per_month', null,
      'retention_days', 730
  )),
  ('custom', 'Custom', 'PLACEHOLDER — configured per customer', 5, jsonb_build_object(
      'files_per_extraction', null,
      'extractions_per_day', null,
      'extractions_per_month', null,
      'records_per_extraction', null,
      'records_per_month', null,
      'storage_bytes', null,
      'exports_per_month', null,
      'retention_days', 730
  ))
on conflict (key) do nothing;
