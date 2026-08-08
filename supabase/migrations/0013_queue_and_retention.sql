-- 0013 — queue claiming, stale-claim reaper, and lead retention
--
-- Claiming lives in SQL because `FOR UPDATE SKIP LOCKED` is the primitive that
-- makes competing consumers safe. Doing it in application code would reintroduce
-- the read-then-write race the queue exists to prevent.

-- ---------------------------------------------------------------------------
-- lead_keys — dedupe identity WITHOUT personal data
--
-- Lead rows are purged once the user has their CSV (see purge_job_leads).
-- Keeping just the opaque dedupe key preserves CROSS-JOB duplicate detection at
-- roughly 8% of the storage — and it is a privacy improvement, not a
-- compromise: the name, company, URL and blurb genuinely disappear while
-- "have I seen this person before?" stays answerable.
-- ---------------------------------------------------------------------------

create table if not exists public.lead_keys (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  dedupe_key text not null,
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  seen_count int not null default 1
);

create unique index if not exists lead_keys_unique on public.lead_keys (user_id, dedupe_key);
create index if not exists lead_keys_user_idx on public.lead_keys (user_id);

alter table public.lead_keys enable row level security;

drop policy if exists lead_keys_select_own on public.lead_keys;
create policy lead_keys_select_own on public.lead_keys
  for select to authenticated using (auth.uid() = user_id or public.is_admin());

-- Writes are service-role only.

-- ---------------------------------------------------------------------------
-- claim_next_job
--
-- SKIP LOCKED means a second worker steps over a row another worker is already
-- claiming rather than blocking on it. Exactly one claimant per job.
-- ---------------------------------------------------------------------------

create or replace function public.claim_next_job(p_claimed_by text)
returns table (job_id uuid, user_id uuid, attempts int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_queue_id uuid;
  v_job_id   uuid;
begin
  select q.id, q.job_id
    into v_queue_id, v_job_id
    from public.job_queue q
   where q.status = 'pending'
     and q.next_attempt_at <= now()
     and q.attempts < q.max_attempts
   order by q.next_attempt_at
   for update skip locked
   limit 1;

  if v_queue_id is null then
    return;
  end if;

  -- `attempts` must be qualified: RETURNS TABLE declares an OUT parameter of
  -- the same name, so a bare reference is ambiguous and raises at runtime.
  update public.job_queue
     set status     = 'claimed',
         claimed_at = now(),
         claimed_by = p_claimed_by,
         attempts   = public.job_queue.attempts + 1
   where id = v_queue_id;

  update public.extraction_jobs
     set status        = 'processing',
         started_at    = coalesce(started_at, now()),
         progress_step = 'Processing files'
   where id = v_job_id;

  return query
    select j.id, j.user_id, q.attempts
      from public.extraction_jobs j
      join public.job_queue q on q.job_id = j.id
     where j.id = v_job_id;
end;
$$;

revoke all on function public.claim_next_job(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- reap_stale_jobs
--
-- Critical without an always-on worker: an `after()` invocation cut short by a
-- function timeout leaves a job 'claimed' forever. This returns it to 'pending'
-- with exponential backoff, or dead-letters it past max_attempts.
-- ---------------------------------------------------------------------------

create or replace function public.reap_stale_jobs(p_timeout_seconds int default 900)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  with stale as (
    select id, job_id, attempts, max_attempts
      from public.job_queue
     where status = 'claimed'
       and claimed_at < now() - make_interval(secs => p_timeout_seconds)
     for update skip locked
  ),
  requeued as (
    -- Explicit ::queue_status casts — a bare string literal in a CASE is typed
    -- text, which Postgres will not coerce into the enum column.
    update public.job_queue q
       set status = case when s.attempts >= s.max_attempts
                         then 'failed'::public.queue_status
                         else 'pending'::public.queue_status end,
           claimed_at = null,
           claimed_by = null,
           -- exponential backoff: 2^attempts minutes, capped at 2^6 = 64
           next_attempt_at = now() + make_interval(mins => power(2, least(s.attempts, 6))::int),
           last_error = 'Reclaimed after stale claim timeout'
      from stale s
     where q.id = s.id
    returning q.job_id, q.status
  )
  update public.extraction_jobs j
     set status = case when r.status = 'failed' then 'failed'::public.job_status
                       else 'queued'::public.job_status end,
         error_code = case when r.status = 'failed' then 'ERR_TIMEOUT' else null end,
         error_message = case when r.status = 'failed'
                              then 'Processing timed out repeatedly' else null end
    from requeued r
   where j.id = r.job_id;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.reap_stale_jobs(int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- purge_job_leads
--
-- Deletes the personal data once the user has downloaded their CSV, while
-- recording each dedupe key in lead_keys so cross-job detection survives.
-- ---------------------------------------------------------------------------

create or replace function public.purge_job_leads(p_job_id uuid, p_user_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int;
begin
  -- Preserve identity keys before the rows go.
  insert into public.lead_keys (user_id, dedupe_key)
  select p_user_id, l.dedupe_key
    from public.extracted_leads l
   where l.extraction_job_id = p_job_id
     and l.user_id = p_user_id
  on conflict (user_id, dedupe_key) do update
    set last_seen = now(),
        seen_count = public.lead_keys.seen_count + 1;

  delete from public.extracted_leads
   where extraction_job_id = p_job_id
     and user_id = p_user_id;

  get diagnostics v_deleted = row_count;

  update public.extraction_jobs
     set progress_step = 'Completed — data purged'
   where id = p_job_id and user_id = p_user_id;

  return v_deleted;
end;
$$;

revoke all on function public.purge_job_leads(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- enqueue_job — creates the queue row for an uploaded job.
-- ---------------------------------------------------------------------------

create or replace function public.enqueue_job(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.job_queue (job_id, status, next_attempt_at)
  values (p_job_id, 'pending', now())
  on conflict (job_id) do nothing;

  update public.extraction_jobs
     set status = 'queued', progress_step = 'Waiting in queue'
   where id = p_job_id and status = 'uploaded';
end;
$$;

revoke all on function public.enqueue_job(uuid) from public, anon, authenticated;
