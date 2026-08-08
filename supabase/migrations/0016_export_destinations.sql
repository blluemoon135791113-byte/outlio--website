-- 0016 — export destinations (device / Google Drive / OneDrive)
--
-- SCHEMA ONLY. The OAuth flows are NOT implemented yet — see the note below.
-- Shipping the table now means the UI can offer "Save to device" today and
-- light up cloud destinations without a migration later.
--
-- ⚠️ TOKEN SECURITY
--
-- `refresh_token` is a long-lived credential to a user's personal Drive. It is
-- as sensitive as a password:
--   · RLS denies all client access (no policies below, deliberately)
--   · only the service role may read it
--   · it must NEVER be logged, returned to the browser, or put in a URL
--
-- Storing third-party OAuth tokens is a meaningful new liability. It requires
-- an OAuth app registration (Google Cloud Console / Azure AD), a published
-- privacy policy naming the scopes, and Google's verification review if the
-- Drive scope is non-restricted. That is a business decision, not just code.

do $$ begin
  create type public.export_destination_kind as enum ('device', 'google_drive', 'onedrive');
exception when duplicate_object then null; end $$;

create table if not exists public.export_destinations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  kind          public.export_destination_kind not null,

  -- Human label, e.g. the connected account's email. Safe to show.
  account_label text,
  -- Target folder id in the provider. Not secret.
  folder_id     text,
  folder_name   text,

  -- ⚠️ SECRETS. Service role only. Never leaves the server.
  access_token  text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes        text,

  is_default    boolean not null default false,
  connected_at  timestamptz,
  last_error    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists export_destinations_set_updated_at on public.export_destinations;
create trigger export_destinations_set_updated_at
  before update on public.export_destinations
  for each row execute function public.set_updated_at();

create index if not exists export_destinations_user_idx
  on public.export_destinations (user_id);

-- One connection per provider per user.
create unique index if not exists export_destinations_user_kind_uniq
  on public.export_destinations (user_id, kind)
  where kind <> 'device';

-- Only one default at a time.
create unique index if not exists export_destinations_one_default
  on public.export_destinations (user_id)
  where is_default;

-- RLS ON, NO POLICIES. This table holds OAuth refresh tokens; there is no
-- read path for a client, even the owning user. The app surfaces only
-- `kind`, `account_label` and `folder_name` through a server query that
-- selects those columns explicitly.
alter table public.export_destinations enable row level security;

-- ---------------------------------------------------------------------------
-- Which destination a job should deliver to.
-- ---------------------------------------------------------------------------

alter table public.extraction_jobs
  add column if not exists destination_kind public.export_destination_kind not null default 'device',
  add column if not exists delivered_at timestamptz,
  add column if not exists delivery_error text;

comment on column public.export_destinations.refresh_token is
  'OAuth refresh token — SECRET. Service role only. Never log, never return to a client.';
