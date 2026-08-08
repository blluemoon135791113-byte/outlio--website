-- 0009 — required contact fields on sign-up: phone + LinkedIn profile URL
--
-- Both are collected so a human can vet an access request before approving it,
-- which is the whole basis of the manual-approval model.
--
-- ⚠️ These are the ACCOUNT HOLDER'S OWN details, self-supplied at sign-up.
-- They are NOT lead data. The `linkedin_url` here is never fetched, visited,
-- or scraped — CLAUDE.md rule 1 still holds absolutely. It is stored as an
-- identifier for manual review only.

alter table public.profiles
  add column if not exists phone        text,
  add column if not exists linkedin_url text;

-- ---------------------------------------------------------------------------
-- Format constraints, applied only when a value is present.
--
-- Deliberately NULLABLE at the database level even though sign-up requires
-- them. Rationale: users created out-of-band — by an admin through the Supabase
-- dashboard, or by the integration test suite — carry no sign-up metadata. A
-- NOT NULL here would break admin user creation for no security gain, since
-- the enforcement that matters happens in the sign-up flow.
-- ---------------------------------------------------------------------------

do $$ begin
  alter table public.profiles
    add constraint profiles_phone_e164
    check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$');
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.profiles
    add constraint profiles_linkedin_url_format
    check (linkedin_url is null or linkedin_url ~ '^https://www\.linkedin\.com/in/[A-Za-z0-9%_-]{2,100}$');
exception when duplicate_object then null; end $$;

create index if not exists profiles_linkedin_url_idx on public.profiles (linkedin_url);

-- ---------------------------------------------------------------------------
-- Carry the values through from sign-up metadata.
--
-- supabase.auth.signUp({ options: { data } }) lands in raw_user_meta_data.
-- Values are already normalised and validated server-side before signUp is
-- called; the CHECK constraints above are the backstop.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, linkedin_url)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'linkedin_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Let users correct their own contact details.
--
-- protect_profile_columns() freezes the privileged columns (role, plan_id,
-- access_expires_at, …). phone and linkedin_url are NOT in that list, so they
-- remain user-editable, which is correct — they are the user's own contact
-- information, not an entitlement.
-- ---------------------------------------------------------------------------
