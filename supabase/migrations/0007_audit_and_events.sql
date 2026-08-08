-- 0007 — admin_audit_logs (append-only), system_events

-- ---------------------------------------------------------------------------
-- admin_audit_logs
--
-- APPEND-ONLY. Triggers raise on UPDATE and DELETE for every role, including
-- the service role. Every state-changing admin action must write a row here in
-- the SAME TRANSACTION as the change it describes — if this write fails, the
-- action rolls back.
-- ---------------------------------------------------------------------------

create table if not exists public.admin_audit_logs (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid references auth.users(id) on delete set null,
  action       text not null,
  target_type  text,
  target_id    uuid,
  target_user_id uuid references auth.users(id) on delete set null,
  before_state jsonb,
  after_state  jsonb,
  reason       text,
  request_id   text,
  ip_address   inet,
  created_at   timestamptz not null default now()
);

create index if not exists admin_audit_logs_admin_idx   on public.admin_audit_logs (admin_id);
create index if not exists admin_audit_logs_target_idx  on public.admin_audit_logs (target_type, target_id);
create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_action_idx  on public.admin_audit_logs (action);

drop trigger if exists admin_audit_logs_no_update on public.admin_audit_logs;
create trigger admin_audit_logs_no_update
  before update on public.admin_audit_logs
  for each row execute function public.deny_mutation();

drop trigger if exists admin_audit_logs_no_delete on public.admin_audit_logs;
create trigger admin_audit_logs_no_delete
  before delete on public.admin_audit_logs
  for each row execute function public.deny_mutation();

alter table public.admin_audit_logs enable row level security;

-- Readable by admins in the UI. No insert policy: writes go through the
-- service role inside the transaction that performs the audited action.
drop policy if exists admin_audit_logs_admin_select on public.admin_audit_logs;
create policy admin_audit_logs_admin_select on public.admin_audit_logs
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- system_events
-- Structured error/event log. Service-role writes only.
-- NEVER contains lead records, file contents, tokens, signed URLs, or cookies.
-- ---------------------------------------------------------------------------

create table if not exists public.system_events (
  id          uuid primary key default gen_random_uuid(),
  level       text not null default 'info',
  event       text not null,
  error_code  text,
  message     text,
  context     jsonb,
  user_id     uuid references auth.users(id) on delete set null,
  job_id      uuid references public.extraction_jobs(id) on delete set null,
  file_id     uuid references public.uploaded_files(id) on delete set null,
  request_id  text,
  duration_ms int,
  created_at  timestamptz not null default now(),
  constraint system_events_level_check check (level in ('debug','info','warn','error','fatal'))
);

create index if not exists system_events_created_idx on public.system_events (created_at desc);
create index if not exists system_events_level_idx   on public.system_events (level);
create index if not exists system_events_code_idx    on public.system_events (error_code);
create index if not exists system_events_job_idx     on public.system_events (job_id);
create index if not exists system_events_user_idx    on public.system_events (user_id);

alter table public.system_events enable row level security;

drop policy if exists system_events_admin_select on public.system_events;
create policy system_events_admin_select on public.system_events
  for select to authenticated using (public.is_admin());
