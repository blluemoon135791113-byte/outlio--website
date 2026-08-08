-- 0012 — storage policies for the private `uploads` bucket
--
-- The bucket is created via the Storage API (private, 10 MB cap, text/html).
-- This migration governs who may touch objects inside it.
--
-- ARCHITECTURE REMINDER
--
-- Clients NEVER read or write storage directly. Uploads go through a server
-- route that validates content and generates the key; downloads use short-lived
-- signed URLs. So the service role does all the real work, and these policies
-- exist as defence in depth: if a publishable-key client ever reached storage,
-- it must still be confined to its own prefix.
--
-- Keys are `{user_id}/{job_id}/{uuid}.html`, so the FIRST path segment is the
-- owning user's id. `storage.foldername(name)` splits on '/', and PostgreSQL
-- arrays are 1-indexed, hence `[1]`.

-- NOTE: there is deliberately no `alter table storage.objects enable row level
-- security` here.
--
-- `storage.objects` is owned by `supabase_admin`, and the `postgres` role the
-- SQL Editor runs as is not its owner, so ALTER TABLE fails with:
--
--     ERROR: 42501: must be owner of table objects
--
-- Supabase enables RLS on that table by default, so the statement was only ever
-- an assertion. Creating and dropping POLICIES is permitted, which is all this
-- migration actually needs.

-- ---------------------------------------------------------------------------
-- Read: own prefix only.
-- ---------------------------------------------------------------------------

drop policy if exists "uploads_select_own_prefix" on storage.objects;
create policy "uploads_select_own_prefix" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Write: own prefix only.
--
-- Note this does NOT make direct client uploads safe or supported — the server
-- route still performs content sniffing, size accounting and key generation.
-- A client that wrote here directly would bypass all of that, which is why the
-- publishable key is never used for storage writes in application code.
-- ---------------------------------------------------------------------------

drop policy if exists "uploads_insert_own_prefix" on storage.objects;
create policy "uploads_insert_own_prefix" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "uploads_update_own_prefix" on storage.objects;
create policy "uploads_update_own_prefix" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Delete: own prefix only. Users may remove their own uploads; job deletion
-- also removes objects, but that runs with the service role.
-- ---------------------------------------------------------------------------

drop policy if exists "uploads_delete_own_prefix" on storage.objects;
create policy "uploads_delete_own_prefix" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- No policy grants `anon` anything. An unauthenticated fetch of an object path
-- must fail; the only legitimate anonymous access is a signed URL, which the
-- Storage API validates outside RLS.
