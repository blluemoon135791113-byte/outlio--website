-- 0010 — entitlement granting + atomic invitation redemption
--
-- Both live in Postgres functions rather than application code because each
-- must be ATOMIC. A grant touches profiles + subscriptions + admin_audit_logs;
-- a redemption additionally increments used_count. Splitting those across
-- round trips would allow a code to be over-redeemed under concurrency, and
-- would allow a grant to half-apply.

-- ---------------------------------------------------------------------------
-- grant_entitlement
--
-- THE single path to access. Every payment provider, the invitation flow, and
-- the admin panel all call this. Provider-agnostic by design (spec §9.1).
--
-- Writes the audit row in the SAME transaction as the change (spec §12.8) — if
-- the audit insert fails, the grant rolls back.
-- ---------------------------------------------------------------------------

create or replace function public.grant_entitlement(
  p_user_id       uuid,
  p_plan_id       uuid,
  p_duration_days int default null,
  p_granted_by    uuid default null,
  p_provider      text default 'manual',
  p_provider_ref  text default null,
  p_reason        text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expires_at    timestamptz;
  v_subscription  uuid;
  v_before        jsonb;
begin
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'No such user: %', p_user_id;
  end if;

  if not exists (select 1 from public.plans where id = p_plan_id) then
    raise exception 'No such plan: %', p_plan_id;
  end if;

  if p_duration_days is not null then
    v_expires_at := now() + make_interval(days => p_duration_days);
  end if;

  select to_jsonb(p) into v_before
    from (select role, plan_id, access_expires_at
            from public.profiles where id = p_user_id) p;

  -- Role becomes 'subscriber'. auth.uid() is null under the service role, so
  -- protect_profile_columns() permits this.
  update public.profiles
     set role              = 'subscriber',
         plan_id           = p_plan_id,
         access_expires_at = v_expires_at,
         suspended_at      = null,
         suspended_reason  = null
   where id = p_user_id;

  insert into public.subscriptions (
    user_id, plan_id, status, provider, provider_ref,
    current_period_start, current_period_end, granted_by
  ) values (
    p_user_id, p_plan_id, 'active', p_provider, p_provider_ref,
    now(), v_expires_at, p_granted_by
  )
  returning id into v_subscription;

  -- Any pending request for this user is now resolved.
  update public.access_requests
     set status      = 'approved',
         reviewed_by = p_granted_by,
         reviewed_at = now()
   where user_id = p_user_id and status = 'pending';

  insert into public.admin_audit_logs (
    admin_id, action, target_type, target_id, target_user_id,
    before_state, after_state, reason
  ) values (
    p_granted_by, 'entitlement.grant', 'profile', p_user_id, p_user_id,
    v_before,
    jsonb_build_object('role','subscriber','plan_id',p_plan_id,
                       'access_expires_at',v_expires_at,'provider',p_provider),
    coalesce(p_reason, 'Entitlement granted via ' || p_provider)
  );

  return v_subscription;
end;
$$;

revoke all on function public.grant_entitlement(uuid, uuid, int, uuid, text, text, text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- revoke_entitlement — the inverse, also audited.
-- ---------------------------------------------------------------------------

create or replace function public.revoke_entitlement(
  p_user_id    uuid,
  p_revoked_by uuid default null,
  p_reason     text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before jsonb;
begin
  select to_jsonb(p) into v_before
    from (select role, plan_id, access_expires_at
            from public.profiles where id = p_user_id) p;

  update public.profiles
     set role = 'registered_user', access_expires_at = now()
   where id = p_user_id;

  update public.subscriptions
     set status = 'cancelled', cancelled_at = now()
   where user_id = p_user_id and status = 'active';

  insert into public.admin_audit_logs (
    admin_id, action, target_type, target_id, target_user_id,
    before_state, after_state, reason
  ) values (
    p_revoked_by, 'entitlement.revoke', 'profile', p_user_id, p_user_id,
    v_before, jsonb_build_object('role','registered_user'),
    coalesce(p_reason, 'Entitlement revoked')
  );
end;
$$;

revoke all on function public.revoke_entitlement(uuid, uuid, text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- redeem_invitation_code
--
-- ATOMICITY IS THE WHOLE POINT.
--
-- The UPDATE ... WHERE used_count < max_uses is a single statement, so Postgres
-- serialises concurrent redemptions on the row. Exactly one caller can observe
-- the row transition from used_count = N to N+1. A read-then-write in
-- application code would let two requests both pass the check.
--
-- Returns a status string rather than raising, so the caller can map it to a
-- specific user-facing message without parsing exception text.
-- ---------------------------------------------------------------------------

create or replace function public.redeem_invitation_code(
  p_code    text,
  p_user_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id       uuid;
  v_plan_id  uuid;
  v_exists   boolean;
begin
  -- Already entitled? Redeeming again would stack subscriptions.
  if exists (
    select 1 from public.profiles
     where id = p_user_id
       and role in ('subscriber','approved_user','admin')
       and (access_expires_at is null or access_expires_at > now())
  ) then
    return 'already_active';
  end if;

  -- Atomic claim. The WHERE clause is the guard; no separate SELECT.
  update public.invitation_codes
     set used_count = used_count + 1
   where code = p_code
     and is_active = true
     and used_count < max_uses
     and (expires_at is null or expires_at > now())
  returning id, plan_id into v_id, v_plan_id;

  if v_id is null then
    -- Distinguish "no such code" from "exhausted/expired" WITHOUT leaking
    -- which, to avoid turning this into a code-enumeration oracle. The caller
    -- shows one generic message; the distinction is for logs only.
    select exists (select 1 from public.invitation_codes where code = p_code)
      into v_exists;
    return case when v_exists then 'unavailable' else 'invalid' end;
  end if;

  if v_plan_id is null then
    select id into v_plan_id from public.plans where key = 'trial';
  end if;

  -- provider_ref must identify THIS REDEMPTION, not the code.
  --
  -- `subscriptions_provider_ref_uniq` is (provider, provider_ref) — correct for
  -- Stripe, where one subscription id maps to exactly one subscription. Passing
  -- the bare code id here made every redeemer of a multi-use code collide,
  -- silently turning a max_uses=3 code into a max_uses=1 code with errors.
  -- Composing code id with user id keeps the Stripe guarantee intact while
  -- allowing a code to be redeemed by as many distinct users as max_uses allows.
  perform public.grant_entitlement(
    p_user_id      => p_user_id,
    p_plan_id      => v_plan_id,
    p_duration_days=> null,
    p_granted_by   => null,
    p_provider     => 'invitation',
    p_provider_ref => v_id::text || ':' || p_user_id::text,
    p_reason       => 'Invitation code redeemed'
  );

  return 'ok';
end;
$$;

revoke all on function public.redeem_invitation_code(text, uuid)
  from public, anon, authenticated;
