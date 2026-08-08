-- 0011 — audit logs must survive user deletion
--
-- BUG THIS FIXES
--
-- `admin_audit_logs.admin_id` and `.target_user_id` were declared
-- `references auth.users(id) on delete set null`. Postgres implements SET NULL
-- as an UPDATE — which the append-only trigger from 0007 correctly refuses:
--
--     ERROR: Table public.admin_audit_logs is append-only; UPDATE is not permitted
--
-- The result: deleting any user who appears in an audit row FAILED. That breaks
-- account deletion (spec §13.3) and the right to erasure under GDPR.
--
-- THE FIX
--
-- Drop the foreign keys and keep plain uuid columns. This is the correct design
-- for an append-only audit log: the whole point is that it outlives the rows it
-- describes. Referential integrity to a table whose rows are deliberately
-- deleted defeats the purpose — "who did this?" must remain answerable after
-- the actor's account is gone.
--
-- The uuid is retained verbatim, so history stays attributable even though the
-- user record no longer exists.

alter table public.admin_audit_logs
  drop constraint if exists admin_audit_logs_admin_id_fkey;

alter table public.admin_audit_logs
  drop constraint if exists admin_audit_logs_target_user_id_fkey;

comment on column public.admin_audit_logs.admin_id is
  'uuid of the acting admin. NO foreign key by design — audit rows outlive the users they describe.';

comment on column public.admin_audit_logs.target_user_id is
  'uuid of the affected user. NO foreign key by design — see admin_id.';

-- ---------------------------------------------------------------------------
-- system_events has the same problem for the same reason.
--
-- Its user_id/job_id/file_id FKs are ON DELETE SET NULL, and while there is no
-- append-only trigger on this table today, an event log should likewise not
-- lose attribution when the subject is deleted. Keep job_id and file_id FKs
-- (those cascade cleanly and are useful for joins) but detach user_id.
-- ---------------------------------------------------------------------------

alter table public.system_events
  drop constraint if exists system_events_user_id_fkey;

comment on column public.system_events.user_id is
  'uuid of the user the event concerns. NO foreign key — events outlive accounts.';
