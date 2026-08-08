-- 0015 — real pricing plans on a CREDIT model
--
-- Replaces the Phase 3 PLACEHOLDER seed. Until now the marketing page and the
-- database disagreed: the page advertised $40 unlimited while plans.limits held
-- invented numbers nobody could actually be put on.
--
-- CREDIT MODEL
--   1 credit = one extraction run  (a job that processes files)
--   1 credit = one CSV export      (a download)
-- So a typical "upload → process → download" cycle costs 2 credits.
--
-- Limits still live entirely in plans.limits and are read at runtime. Nothing
-- here is hardcoded in application code.

-- Trial and the three real tiers.
insert into public.plans (key, name, description, sort_order, is_active, limits) values
  ('trial', 'Free trial', '3 days, capped', 1, true, jsonb_build_object(
      'credits_per_month',       10,
      'files_per_extraction',    5,
      'extractions_per_day',     null,
      'extractions_per_month',   null,
      'records_per_extraction',  null,
      'records_per_month',       null,
      'storage_bytes',           104857600,
      'exports_per_month',       null,
      'retention_days',          3
  )),
  ('starter', 'Lead Engine', '$38/month · 100 credits', 2, true, jsonb_build_object(
      'credits_per_month',       100,
      'files_per_extraction',    10,
      'extractions_per_day',     null,
      'extractions_per_month',   null,
      'records_per_extraction',  null,
      'records_per_month',       null,
      'storage_bytes',           1073741824,
      'exports_per_month',       null,
      'retention_days',          30
  )),
  ('professional', 'Pro', '$73/month · 300 credits', 3, true, jsonb_build_object(
      'credits_per_month',       300,
      'files_per_extraction',    30,
      'extractions_per_day',     null,
      'extractions_per_month',   null,
      'records_per_extraction',  null,
      'records_per_month',       null,
      'storage_bytes',           10737418240,
      'exports_per_month',       null,
      'retention_days',          90
  )),
  ('custom', 'Custom', '1000+ credits · contact us', 4, true, jsonb_build_object(
      'credits_per_month',       1000,
      'files_per_extraction',    50,
      'extractions_per_day',     null,
      'extractions_per_month',   null,
      'records_per_extraction',  null,
      'records_per_month',       null,
      'storage_bytes',           53687091200,
      'exports_per_month',       null,
      'retention_days',          365
  ))
on conflict (key) do update
  set name        = excluded.name,
      description = excluded.description,
      sort_order  = excluded.sort_order,
      is_active   = excluded.is_active,
      limits      = excluded.limits;

-- The old 'agency' tier is no longer offered. Deactivate rather than delete:
-- subscriptions may still reference it, and plans.id is a restrict FK.
update public.plans set is_active = false where key = 'agency';

-- ---------------------------------------------------------------------------
-- credits metric
-- ---------------------------------------------------------------------------

alter table public.usage_counters drop constraint if exists usage_counters_metric_check;
alter table public.usage_counters
  add constraint usage_counters_metric_check
  check (metric in ('extractions', 'files', 'records', 'exports', 'storage_bytes', 'credits'));

-- ---------------------------------------------------------------------------
-- consume_credit
--
-- ATOMIC check-and-spend. The balance is read and written in ONE statement, so
-- two concurrent actions cannot both spend the last credit — the same reason
-- invitation redemption lives in SQL.
--
-- Returns the remaining balance, or -1 when there were not enough credits.
-- Admins are exempt and always return a large sentinel.
-- ---------------------------------------------------------------------------

create or replace function public.consume_credit(
  p_user_id      uuid,
  p_amount       int default 1,
  p_period_start timestamptz default date_trunc('month', now()),
  p_period_end   timestamptz default date_trunc('month', now()) + interval '1 month'
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowance int;
  v_used      bigint;
  v_role      public.user_role;
begin
  select role into v_role from public.profiles where id = p_user_id;
  if v_role = 'admin' then
    return 999999;
  end if;

  select (p.limits ->> 'credits_per_month')::int
    into v_allowance
    from public.profiles pr
    join public.plans p on p.id = pr.plan_id
   where pr.id = p_user_id;

  -- No plan, or an unlimited plan.
  if v_allowance is null then
    return -1;
  end if;

  insert into public.usage_counters (user_id, metric, period_start, period_end, count)
  values (p_user_id, 'credits', p_period_start, p_period_end, p_amount)
  on conflict (user_id, metric, period_start) do update
    set count = public.usage_counters.count + p_amount
  returning count into v_used;

  if v_used > v_allowance then
    -- Roll back the spend: the caller gets nothing and the balance is untouched.
    update public.usage_counters
       set count = count - p_amount
     where user_id = p_user_id
       and metric = 'credits'
       and period_start = p_period_start;
    return -1;
  end if;

  return v_allowance - v_used::int;
end;
$$;

revoke all on function public.consume_credit(uuid, int, timestamptz, timestamptz)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- credit_balance — read-only, for the dashboard.
-- ---------------------------------------------------------------------------

create or replace function public.credit_balance(p_user_id uuid)
returns table (allowance int, used int, remaining int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowance int;
  v_used      int;
begin
  select (p.limits ->> 'credits_per_month')::int
    into v_allowance
    from public.profiles pr
    join public.plans p on p.id = pr.plan_id
   where pr.id = p_user_id;

  select coalesce(count, 0)::int into v_used
    from public.usage_counters
   where user_id = p_user_id
     and metric = 'credits'
     and period_start = date_trunc('month', now());

  allowance := coalesce(v_allowance, 0);
  used      := coalesce(v_used, 0);
  remaining := greatest(allowance - used, 0);
  return next;
end;
$$;

revoke all on function public.credit_balance(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- purge_expired_exports
--
-- Answers "do the CSVs pile up forever?" — no. Exports older than the plan's
-- retention_days are marked for removal. Storage objects are deleted by the
-- caller, which has the storage client; SQL only decides WHAT expires.
-- ---------------------------------------------------------------------------

create or replace function public.expired_export_paths(p_limit int default 200)
returns table (job_id uuid, user_id uuid, export_storage_path text)
language sql
stable
security definer
set search_path = public
as $$
  select j.id, j.user_id, j.export_storage_path
    from public.extraction_jobs j
    join public.profiles pr on pr.id = j.user_id
    left join public.plans p on p.id = pr.plan_id
   where j.export_storage_path is not null
     and j.completed_at is not null
     and j.completed_at < now() - make_interval(
           days => coalesce((p.limits ->> 'retention_days')::int, 30))
   limit p_limit;
$$;

revoke all on function public.expired_export_paths(int) from public, anon, authenticated;
