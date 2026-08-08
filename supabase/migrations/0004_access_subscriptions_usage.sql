-- 0004 — access_requests, subscriptions, usage_counters, invitation_codes

-- ---------------------------------------------------------------------------
-- access_requests
-- ---------------------------------------------------------------------------

create table if not exists public.access_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  request_type  public.access_request_type not null,
  status        public.access_request_status not null default 'pending',
  message       text,
  admin_note    text,
  reviewed_by   uuid references auth.users(id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists access_requests_set_updated_at on public.access_requests;
create trigger access_requests_set_updated_at
  before update on public.access_requests
  for each row execute function public.set_updated_at();

create index if not exists access_requests_user_id_idx on public.access_requests (user_id);
create index if not exists access_requests_status_idx  on public.access_requests (status);
create index if not exists access_requests_created_idx on public.access_requests (created_at desc);

-- At most one pending request per user.
create unique index if not exists access_requests_one_pending_per_user
  on public.access_requests (user_id)
  where status = 'pending';

alter table public.access_requests enable row level security;

drop policy if exists access_requests_select_own on public.access_requests;
create policy access_requests_select_own on public.access_requests
  for select to authenticated using (auth.uid() = user_id or public.is_admin());

drop policy if exists access_requests_insert_own on public.access_requests;
create policy access_requests_insert_own on public.access_requests
  for insert to authenticated with check (auth.uid() = user_id);

-- Users may NOT update their own request (that would let them self-approve).
drop policy if exists access_requests_admin_update on public.access_requests;
create policy access_requests_admin_update on public.access_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- subscriptions (entitlements)
-- ---------------------------------------------------------------------------

create table if not exists public.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  plan_id            uuid not null references public.plans(id) on delete restrict,
  status             public.subscription_status not null default 'active',
  provider           text not null default 'manual',
  provider_ref       text,
  current_period_start timestamptz not null default now(),
  current_period_end   timestamptz,
  cancel_at          timestamptz,
  cancelled_at       timestamptz,
  granted_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_plan_id_idx on public.subscriptions (plan_id);
create index if not exists subscriptions_status_idx  on public.subscriptions (status);
create unique index if not exists subscriptions_provider_ref_uniq
  on public.subscriptions (provider, provider_ref)
  where provider_ref is not null;

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions
  for select to authenticated using (auth.uid() = user_id or public.is_admin());

-- Writes happen through grantEntitlement() with the service role, or by admins.
drop policy if exists subscriptions_admin_write on public.subscriptions;
create policy subscriptions_admin_write on public.subscriptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- usage_counters
-- Incremented in the SAME transaction as the action being measured.
-- ---------------------------------------------------------------------------

create table if not exists public.usage_counters (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  metric       text not null,
  period_start timestamptz not null,
  period_end   timestamptz not null,
  count        bigint not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint usage_counters_metric_check check (
    metric in ('extractions', 'files', 'records', 'exports', 'storage_bytes')
  ),
  constraint usage_counters_count_nonneg check (count >= 0)
);

drop trigger if exists usage_counters_set_updated_at on public.usage_counters;
create trigger usage_counters_set_updated_at
  before update on public.usage_counters
  for each row execute function public.set_updated_at();

create unique index if not exists usage_counters_unique
  on public.usage_counters (user_id, metric, period_start);
create index if not exists usage_counters_user_idx on public.usage_counters (user_id);

alter table public.usage_counters enable row level security;

drop policy if exists usage_counters_select_own on public.usage_counters;
create policy usage_counters_select_own on public.usage_counters
  for select to authenticated using (auth.uid() = user_id or public.is_admin());

-- Increments are service-role only. No user-facing write policy, deliberately.

-- ---------------------------------------------------------------------------
-- invitation_codes
-- Codes are generated server-side and compared in constant time in app code.
-- ---------------------------------------------------------------------------

create table if not exists public.invitation_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  plan_id     uuid references public.plans(id) on delete set null,
  max_uses    int not null default 1,
  used_count  int not null default 0,
  expires_at  timestamptz,
  is_active   boolean not null default true,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint invitation_codes_uses_check check (used_count <= max_uses),
  constraint invitation_codes_max_uses_check check (max_uses > 0)
);

drop trigger if exists invitation_codes_set_updated_at on public.invitation_codes;
create trigger invitation_codes_set_updated_at
  before update on public.invitation_codes
  for each row execute function public.set_updated_at();

create index if not exists invitation_codes_active_idx on public.invitation_codes (is_active);

alter table public.invitation_codes enable row level security;

-- Admins only. Redemption runs through the service role so a user can never
-- read the code table to enumerate valid codes.
drop policy if exists invitation_codes_admin_all on public.invitation_codes;
create policy invitation_codes_admin_all on public.invitation_codes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
