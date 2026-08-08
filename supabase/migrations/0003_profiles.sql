-- 0003 — profiles
-- id is BOTH primary key and FK to auth.users(id).
-- role is NOT user-updatable. Enforced by trigger, not by policy alone.

create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text,
  full_name          text,
  company_name       text,
  role               public.user_role not null default 'registered_user',
  plan_id            uuid references public.plans(id) on delete set null,
  access_expires_at  timestamptz,
  suspended_at       timestamptz,
  suspended_reason   text,
  consent_accepted_at timestamptz,
  deleted_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index if not exists profiles_role_idx       on public.profiles (role);
create index if not exists profiles_plan_id_idx    on public.profiles (plan_id);
create index if not exists profiles_deleted_at_idx on public.profiles (deleted_at);
create index if not exists profiles_expires_idx    on public.profiles (access_expires_at);

-- ---------------------------------------------------------------------------
-- Auto-create a profile when an auth user is created.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- PRIVILEGE ESCALATION GUARD
--
-- A user may update only full_name and company_name. Any attempt to change a
-- privileged column is silently reverted to the stored value. The service role
-- and admins bypass this via the is_admin() / role check below.
--
-- This is a TRIGGER, not just a policy, because a policy alone cannot express
-- "these columns are frozen but the row is otherwise writable".
-- ---------------------------------------------------------------------------

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null for the service role and for the worker; allow those.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  new.role                := old.role;
  new.plan_id             := old.plan_id;
  new.access_expires_at   := old.access_expires_at;
  new.suspended_at        := old.suspended_at;
  new.suspended_reason    := old.suspended_reason;
  new.deleted_at          := old.deleted_at;
  new.created_at          := old.created_at;
  new.id                  := old.id;

  return new;
end;
$$;

drop trigger if exists profiles_protect_columns on public.profiles;
create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- No INSERT policy: profiles are created only by the on_auth_user_created
-- trigger (security definer). No DELETE policy: removal cascades from
-- auth.users. Both omissions are deliberate.
