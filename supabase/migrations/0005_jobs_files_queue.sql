-- 0005 — extraction_jobs, uploaded_files, job_queue

-- ---------------------------------------------------------------------------
-- extraction_jobs
-- ---------------------------------------------------------------------------

create table if not exists public.extraction_jobs (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  status              public.job_status not null default 'uploaded',
  dedupe_mode         public.dedupe_mode not null default 'remove_exact',

  file_count          int not null default 0,
  total_bytes         bigint not null default 0,

  progress_step       text,
  progress_current    int not null default 0,
  progress_total      int not null default 0,

  leads_parsed        int not null default 0,
  leads_kept          int not null default 0,
  duplicates_found    int not null default 0,
  duplicates_removed  int not null default 0,

  export_storage_path text,
  error_code          text,
  error_message       text,
  request_id          text,

  started_at          timestamptz,
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists extraction_jobs_set_updated_at on public.extraction_jobs;
create trigger extraction_jobs_set_updated_at
  before update on public.extraction_jobs
  for each row execute function public.set_updated_at();

create index if not exists extraction_jobs_user_idx    on public.extraction_jobs (user_id);
create index if not exists extraction_jobs_status_idx  on public.extraction_jobs (status);
create index if not exists extraction_jobs_created_idx on public.extraction_jobs (user_id, created_at desc);

alter table public.extraction_jobs enable row level security;

drop policy if exists extraction_jobs_select_own on public.extraction_jobs;
create policy extraction_jobs_select_own on public.extraction_jobs
  for select to authenticated using (auth.uid() = user_id or public.is_admin());

drop policy if exists extraction_jobs_insert_own on public.extraction_jobs;
create policy extraction_jobs_insert_own on public.extraction_jobs
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists extraction_jobs_update_own on public.extraction_jobs;
create policy extraction_jobs_update_own on public.extraction_jobs
  for update to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists extraction_jobs_delete_own on public.extraction_jobs;
create policy extraction_jobs_delete_own on public.extraction_jobs
  for delete to authenticated using (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------------
-- uploaded_files
-- storage_path is ALWAYS server-generated: {user_id}/{job_id}/{uuid}.html
-- original_filename is a display string only — it never touches a filesystem
-- path or a shell argument.
-- ---------------------------------------------------------------------------

create table if not exists public.uploaded_files (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  extraction_job_id uuid not null references public.extraction_jobs(id) on delete cascade,

  original_filename text not null,
  storage_path      text not null unique,
  byte_size         bigint not null,
  content_sha256    char(64) not null,

  status            public.file_status not null default 'pending',
  leads_found       int not null default 0,
  error_code        text,
  error_message     text,

  processed_at      timestamptz,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint uploaded_files_byte_size_check check (byte_size > 0)
);

drop trigger if exists uploaded_files_set_updated_at on public.uploaded_files;
create trigger uploaded_files_set_updated_at
  before update on public.uploaded_files
  for each row execute function public.set_updated_at();

create index if not exists uploaded_files_user_idx   on public.uploaded_files (user_id);
create index if not exists uploaded_files_job_idx    on public.uploaded_files (extraction_job_id);
create index if not exists uploaded_files_status_idx on public.uploaded_files (status);

-- Detect re-upload of identical content. Surfaced as a WARNING, not a hard
-- error — reprocessing the same file can be intentional.
create unique index if not exists uploaded_files_user_sha_uniq
  on public.uploaded_files (user_id, content_sha256)
  where deleted_at is null;

alter table public.uploaded_files enable row level security;

drop policy if exists uploaded_files_select_own on public.uploaded_files;
create policy uploaded_files_select_own on public.uploaded_files
  for select to authenticated using (auth.uid() = user_id or public.is_admin());

drop policy if exists uploaded_files_insert_own on public.uploaded_files;
create policy uploaded_files_insert_own on public.uploaded_files
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists uploaded_files_delete_own on public.uploaded_files;
create policy uploaded_files_delete_own on public.uploaded_files
  for delete to authenticated using (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------------
-- job_queue
-- RLS ENABLED, NO POLICIES → denies all access to non-service-role clients.
-- That is the correct and deliberate default for a table only the worker touches.
-- ---------------------------------------------------------------------------

create table if not exists public.job_queue (
  id              uuid primary key default gen_random_uuid(),
  job_id          uuid not null unique references public.extraction_jobs(id) on delete cascade,
  status          public.queue_status not null default 'pending',
  attempts        int not null default 0,
  max_attempts    int not null default 3,
  claimed_at      timestamptz,
  claimed_by      text,
  next_attempt_at timestamptz not null default now(),
  last_error      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists job_queue_set_updated_at on public.job_queue;
create trigger job_queue_set_updated_at
  before update on public.job_queue
  for each row execute function public.set_updated_at();

-- The claim query orders by next_attempt_at among pending rows.
create index if not exists job_queue_claim_idx
  on public.job_queue (status, next_attempt_at)
  where status = 'pending';
create index if not exists job_queue_stale_idx
  on public.job_queue (status, claimed_at)
  where status = 'claimed';

alter table public.job_queue enable row level security;
-- Intentionally no policies.
