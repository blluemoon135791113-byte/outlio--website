-- 0014 — recover jobs that were created but never enqueued
--
-- THE GAP THIS CLOSES
--
-- Uploads happen in two steps: create the job and issue signed upload URLs,
-- then finalise and enqueue. If the browser closes, crashes, or loses its
-- connection between those two calls, the job sits in `uploaded` forever with
-- `pending` files and NO row in job_queue.
--
-- `reap_stale_jobs()` cannot see these — it only looks for `claimed` rows that
-- went stale. A job that was never claimed, and never even queued, is invisible
-- to it. Observed in production: two such jobs after failed upload attempts.
--
-- This sweep finds them and either enqueues them (files did arrive) or fails
-- them honestly (no files arrived).

create or replace function public.reap_orphaned_uploads(p_older_than_minutes int default 10)
returns table (enqueued int, failed int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enqueued int := 0;
  v_failed   int := 0;
begin
  -- Jobs stuck in 'uploaded' with no queue row, old enough that an in-flight
  -- upload is no longer a plausible explanation.
  with orphaned as (
    select j.id,
           (select count(*) from public.uploaded_files f
             where f.extraction_job_id = j.id and f.deleted_at is null) as file_count
      from public.extraction_jobs j
     where j.status = 'uploaded'
       and j.created_at < now() - make_interval(mins => p_older_than_minutes)
       and not exists (select 1 from public.job_queue q where q.job_id = j.id)
  ),
  -- Files present: the upload did land, only the enqueue was lost.
  requeued as (
    insert into public.job_queue (job_id, status, next_attempt_at)
    select o.id, 'pending', now() from orphaned o where o.file_count > 0
    on conflict (job_id) do nothing
    returning job_id
  ),
  marked_queued as (
    update public.extraction_jobs j
       set status = 'queued', progress_step = 'Waiting in queue'
      from requeued r
     where j.id = r.job_id
    returning j.id
  ),
  -- No files at all: nothing to process. Fail it rather than leave it hanging.
  marked_failed as (
    update public.extraction_jobs j
       set status = 'failed',
           error_code = 'ERR_STORAGE',
           error_message = 'Upload did not complete.'
      from orphaned o
     where j.id = o.id and o.file_count = 0
    returning j.id
  )
  select (select count(*) from marked_queued), (select count(*) from marked_failed)
    into v_enqueued, v_failed;

  enqueued := v_enqueued;
  failed := v_failed;
  return next;
end;
$$;

revoke all on function public.reap_orphaned_uploads(int) from public, anon, authenticated;
