-- 0008 — rate limiting + admin bootstrap
--
-- Rate limiting is backed by Postgres rather than Redis/Upstash. Same reasoning
-- as the job queue (docs/ARCHITECTURE.md §1): transactional with application
-- data, no extra vendor, inspectable with plain SQL. At this scale the extra
-- round trip is irrelevant; revisit if auth traffic grows by orders of magnitude.

create table if not exists public.rate_limits (
  id            uuid primary key default gen_random_uuid(),
  bucket        text not null,          -- e.g. 'auth:signin', 'upload', 'export'
  subject       text not null,          -- e.g. 'ip:1.2.3.4|email:a@b.com'
  window_start  timestamptz not null,
  attempts      int not null default 0,
  blocked_until timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists rate_limits_set_updated_at on public.rate_limits;
create trigger rate_limits_set_updated_at
  before update on public.rate_limits
  for each row execute function public.set_updated_at();

create unique index if not exists rate_limits_unique
  on public.rate_limits (bucket, subject, window_start);
create index if not exists rate_limits_sweep_idx
  on public.rate_limits (window_start);

-- Service role only. RLS on, no policies.
alter table public.rate_limits enable row level security;

-- ---------------------------------------------------------------------------
-- Atomic consume-a-token. Returns the row AFTER incrementing, so the caller
-- sees a truthful count even under concurrency. The unique index plus
-- ON CONFLICT makes this safe without an explicit lock.
-- ---------------------------------------------------------------------------

create or replace function public.consume_rate_limit(
  p_bucket        text,
  p_subject       text,
  p_window_start  timestamptz,
  p_max_attempts  int,
  p_block_seconds int
)
returns table (attempts int, blocked_until timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempts int;
  v_blocked  timestamptz;
begin
  insert into public.rate_limits (bucket, subject, window_start, attempts)
  values (p_bucket, p_subject, p_window_start, 1)
  on conflict (bucket, subject, window_start) do update
    set attempts = public.rate_limits.attempts + 1
  returning public.rate_limits.attempts, public.rate_limits.blocked_until
    into v_attempts, v_blocked;

  -- Trip the breaker on the attempt AFTER the allowance is used up, so
  -- p_max_attempts = 5 permits five tries and blocks the sixth.
  if v_attempts > p_max_attempts and v_blocked is null then
    update public.rate_limits
       set blocked_until = now() + make_interval(secs => p_block_seconds)
     where bucket = p_bucket
       and subject = p_subject
       and window_start = p_window_start
    returning public.rate_limits.blocked_until into v_blocked;
  end if;

  attempts := v_attempts;
  blocked_until := v_blocked;
  return next;
end;
$$;

-- Housekeeping: drop windows older than a day.
create or replace function public.sweep_rate_limits()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  delete from public.rate_limits
   where window_start < now() - interval '1 day'
     and (blocked_until is null or blocked_until < now());
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------------------------------------------------------
-- Atomic usage increment.
--
-- Concurrent callers serialise on the unique index (user_id, metric,
-- period_start) rather than read-modify-write racing, so two requests cannot
-- both slip under a limit. Returns the new total.
-- ---------------------------------------------------------------------------

create or replace function public.increment_usage(
  p_user_id      uuid,
  p_metric       text,
  p_period_start timestamptz,
  p_period_end   timestamptz,
  p_by           int default 1
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count bigint;
begin
  insert into public.usage_counters (user_id, metric, period_start, period_end, count)
  values (p_user_id, p_metric, p_period_start, p_period_end, p_by)
  on conflict (user_id, metric, period_start) do update
    set count = public.usage_counters.count + p_by
  returning public.usage_counters.count into v_count;

  return v_count;
end;
$$;

revoke all on function public.increment_usage(uuid, text, timestamptz, timestamptz, int)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin bootstrap.
--
-- There is NO self-service path to admin and NO API route that can grant it.
-- The first admin is promoted by calling this function explicitly with the
-- service role, from a documented one-off statement:
--
--     select public.bootstrap_admin('you@example.com');
--
-- It is deliberately NOT wired to an env var read at migration time, because
-- that would silently re-promote on every migration run.
-- ---------------------------------------------------------------------------

create or replace function public.bootstrap_admin(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = p_email;

  if v_user_id is null then
    raise exception 'No auth user with email %. Sign up first, then run this.', p_email;
  end if;

  update public.profiles set role = 'admin' where id = v_user_id;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id,
                                       target_user_id, after_state, reason)
  values (v_user_id, 'admin.bootstrap', 'profile', v_user_id, v_user_id,
          jsonb_build_object('role', 'admin'),
          'Initial admin bootstrap via bootstrap_admin()');

  return v_user_id;
end;
$$;

revoke all on function public.bootstrap_admin(text) from public, anon, authenticated;
