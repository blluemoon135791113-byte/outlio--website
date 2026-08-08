# Progress

Append-only log. Read this before writing any code.

---

## 2026-08-06 — Phase 0 and Phase 1 complete

### Built

**Phase 0 (gate):**
- `docs/REPO_AUDIT.md` — repository inventory
- `docs/DESIGN_TOKENS.md` — extracted design system + app adaptation rules

**Phase 1 (gate):**
- `docs/SCRAPER_AUDIT.md` — sections A–K
- `docs/UNSUPPORTED_FIELDS.md`
- `docs/SELECTOR_MAP.md` — validated selectors (written 2026-08-05)

**Supporting:**
- `Linkedin Sales Navigator Scraper SaaS/recovered/scraper_gui_recovered.py`
- `.gitignore` — rules blocking real saved pages, `.rar`, `.exe`, `.pyc`

### Files touched

| File | Change |
|---|---|
| `.gitignore` | **modified** — added personal-data and binary exclusions |
| `docs/*.md` | created (5 files) |
| `…/recovered/scraper_gui_recovered.py` | created |

**Zero application code written. `app/` untouched.**

### Key findings

1. **The existing scraper is obsolete.** LinkedIn moved Sales Navigator from
   `<table>` to `<ol>/<li>`. Every structural selector returns 0 matches. The tool
   extracts zero leads from a page saved today.
2. **Source was lost; recovered from bytecode.** The `.exe` is a PyInstaller
   bundle. Extracted the CArchive, unmarshalled with CPython 3.11, disassembled.
   Never executed.
3. **No network I/O in the original** — zero `certifi`/`urllib3` is conclusive.
   The "file processor, not a crawler" constraint held from the start.
4. **New parser validated: 25/25 rows, 100% on ten fields, 25 unique dedupe keys.**
5. **Silent-corruption trap:** `div[data-anonymize="job-title"]` still matches but
   now holds tenure, not the title. Real titles are at
   `span[data-anonymize="title"]`.

### Decisions

| Decision | Value | Source |
|---|---|---|
| Product URL | **`outlio.io/dashboard`** via `app/(product)/dashboard/` | user, 2026-08-06 |
| `Notes` / `Date Entered` | **dropped** | user, 2026-08-06 |
| Database | **Supabase** — project `ptewhpmxzenbmxlizxhu` | user, 2026-08-06 |
| Scraper integration | **Port to TypeScript + cheerio** (spec §5.1.J option 2) | Phase 1 audit |
| Worker runtime | **Node** — no Python service, §11.4 not needed | follows from above |
| Name/URL storage | **separate columns**; `sanitizeCell()` unchanged; links rebuilt at export | Phase 1 §H2 |

### Deviations from spec

| Spec | Reality | Action |
|---|---|---|
| `pnpm` | repo uses **npm** | all commands `npm run …` |
| shadcn/ui "(existing)" | **not installed** | install in Phase 3, CSS-variable mode |
| `typecheck` + `test` scripts | **neither exists** | add both at start of Phase 3 |
| Product at `/app` | `app/` is the router root | `app/(product)/dashboard/` |
| `lib/supabase/` | Supabase scaffold suggests `utils/supabase/` | follow spec: `lib/supabase/` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | project issues `sb_publishable_…` | use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Golden test vs the binary | `.exe` is Windows-only, cannot run | equivalence proven against `SELECTOR_MAP.md` §3 |

### Open items — need the user

1. **`SUPABASE_SERVICE_ROLE_KEY`** — must be placed in `.env.local` by the user
   directly. Never pasted in chat, never prefixed `NEXT_PUBLIC_`.
2. **More saved pages** — one page only. Every field showed 100% presence, so
   nullable behaviour is unverified. Want: a different search, and a "Saved leads"
   list. Kept local, never committed.
3. **Worker host** — Railway / Fly.io / Render account needed by Phase 7.
4. **Legal review (spec §13.3)** — lead data on identifiable people is personal
   data under GDPR/UK GDPR, and processing platform-sourced data may be restricted
   by that platform's terms regardless of how the file was obtained. This is a
   business decision for the owner and qualified counsel, not something to resolve
   in code or copy. **Unresolved.**
5. **Placeholder Search Console tokens** — `app/layout.tsx:70-73` ships literal
   `'your-google-verification-code'` / `'your-yandex-verification-code'`. Outside
   SaaS scope; flagged because `app/` is otherwise read-only.

---

## 2026-08-06 — Phase 2 complete

### Built

- `docs/ARCHITECTURE.md` — extraction location, rejected alternatives, trust
  boundaries, request lifecycle, failure modes, idempotency, retention,
  observability, environments
- `docs/FILE_TREE.md` — planned structure with per-directory responsibility
- `CLAUDE.md` — rewritten with all decisions baked in
- `docs/IMPLEMENTATION_PROMPT.md` — spec copied into the repo
- `.env.local` — created, gitignored, **verified working**

**Zero application code written. `app/` still untouched.**

### Supabase verified

Service role key confirmed against the live project:

| Check | Result |
|---|---|
| JWT structure | 3 segments, valid |
| `role` claim | `service_role` ✅ |
| `ref` claim | `ptewhpmxzenbmxlizxhu` — matches URL ✅ |
| Expiry | 2036-08-06 ✅ |
| `GET /rest/v1/` | **HTTP 200** ✅ |
| Tables in `public` | **0** — greenfield |

### Architecture decisions

| Decision | Value |
|---|---|
| Extraction location | Dedicated **Node worker**, own container, no public inbound HTTP |
| Queue | **Postgres** `job_queue`, `FOR UPDATE SKIP LOCKED` |
| Fallback if self-hosting is rejected | Inngest / Trigger.dev (adds a vendor, moves job state out of Postgres) |
| Spec §11.4 subprocess contract | **VOID** — no subprocess exists |
| Idempotency | Three layers: claim lock, `content_sha256`, delete-then-insert scoped to `extraction_job_id` |
| Zero-lead result | `ERR_FILE_FORMAT` — loud failure, never silent success |

### Open items — unchanged from Phase 1, minus the resolved key

1. ~~`SUPABASE_SERVICE_ROLE_KEY`~~ — ✅ **resolved 2026-08-06**, verified connecting
2. **More saved pages** — still one page only. Every field showed 100% presence, so
   nullable behaviour remains unverified. Want a different search and a "Saved
   leads" list. **Highest-value outstanding item.**
3. **Worker host** — Railway / Fly.io / Render account needed by Phase 7
4. **Staging Supabase project** — does not exist; recommend creating before Phase 12
5. **Legal review (spec §13.3)** — GDPR/UK GDPR and platform-terms question.
   Business decision for the owner and counsel. **Unresolved.**
6. **Placeholder Search Console tokens** — `app/layout.tsx:70-73`. Outside SaaS scope.

---

## 2026-08-06 — Phase 3 (schema + RLS) — code complete, **migrations not yet applied**

### Built

| File | Purpose |
|---|---|
| `supabase/migrations/0001_extensions_enums_functions.sql` | pgcrypto, pg_trgm, 10 enums, `set_updated_at()`, `is_admin()`, `deny_mutation()` |
| `0002_plans.sql` | `plans` + seeded PLACEHOLDER limits |
| `0003_profiles.sql` | `profiles`, auth trigger, **privilege-escalation guard** |
| `0004_access_subscriptions_usage.sql` | `access_requests`, `subscriptions`, `usage_counters`, `invitation_codes` |
| `0005_jobs_files_queue.sql` | `extraction_jobs`, `uploaded_files`, `job_queue` |
| `0006_extracted_leads.sql` | leads — columns from `SELECTOR_MAP.md` §3 |
| `0007_audit_and_events.sql` | `admin_audit_logs` (append-only), `system_events` |
| `supabase/APPLY_ALL.sql` | all migrations concatenated, paste-ready |
| `lib/supabase/{client,server,admin}.ts` | the three clients |
| `types/database.ts` | hand-written, regenerate with `npm run db:types` |
| `tests/integration/{helpers.ts,rls.test.ts}` | RLS + escalation tests |
| `vitest.config.ts`, `tests/setup.ts` | test harness |

### Tooling added

- `npm run typecheck` → `tsc --noEmit` ✅ **passes**
- `npm test` → `vitest run` ✅ **runs**
- `npm run db:types` → regenerate types from the live schema
- Installed: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `server-only`,
  `vitest`, `@vitest/coverage-v8`, `dotenv`

### Verification

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ **zero errors** |
| `npx eslint lib/ types/ tests/` | ✅ **zero problems** |
| `npm run lint` (whole repo) | ⚠️ 1 error + 10 warnings, **all pre-existing** |
| `npm test` | ❌ **6 failed — `PGRST205: table not found`** |

The lint error is in `app/components/OrbitalCaseStudies.tsx:135` from commit
`c9589c6`, predating this session. `app/` was not modified. Per `CLAUDE.md` rule
5 it is not mine to fix — flagged, not touched.

### 🐛 Bug found and fixed on first apply attempt

The user's first paste failed:

```
ERROR: 42P01: relation "public.profiles" does not exist
LINE 109: select 1 from public.profiles
```

**Cause:** `is_admin()` was declared `language sql`. Postgres parses and validates
a SQL-language function body at CREATE time, so it required `public.profiles` to
already exist — but the policies in `0002_plans.sql` already need `is_admin()`,
which forces the function to be defined before the table it reads.

**Fix:** `is_admin()` is now `language plpgsql`. plpgsql bodies resolve table
references at execution time, not creation time, so the function can be defined
ahead of `profiles` while still working correctly once `0003` has run.

### Verified against a real Postgres

Installed `postgresql@16` locally and built a throwaway cluster with a
Supabase-shaped stub (`auth.users`, `auth.uid()`, and the `anon` /
`authenticated` / `service_role` roles) so migrations run unmodified.

| Verification | Result |
|---|---|
| `APPLY_ALL.sql` runs clean | ✅ exit 0, zero errors |
| 12 tables created | ✅ |
| RLS enabled on **every** table | ✅ 0 tables without RLS |
| `job_queue` has zero policies | ✅ correct — denies all non-service-role |
| 5 plans seeded | ✅ |
| Profile auto-created on `auth.users` insert | ✅ |
| **User cannot self-promote to `admin`** | ✅ role reverted to `registered_user` |
| **User cannot grant themselves `access_expires_at`** | ✅ reverted to null |
| User *can* update `full_name` | ✅ allowed column works |
| **Bob cannot read Alice's profile** | ✅ 0 rows |
| `job_queue` invisible to `authenticated` | ✅ 0 rows |
| **`admin_audit_logs` UPDATE blocked** | ✅ raises, even as superuser |
| **`admin_audit_logs` DELETE blocked** | ✅ raises, even as superuser |
| One pending `access_request` per user | ✅ second insert rejected |
| **Idempotency — second full run** | ✅ exit 0, no duplicates, 12 tables, RLS intact |

Test cluster stopped and left no stray process. To rebuild it:
`initdb` a temp cluster, apply a Supabase stub schema, then `APPLY_ALL.sql`.

### ✅ Applied to the live project — 2026-08-06

Migrations applied to `ptewhpmxzenbmxlizxhu` via the SQL Editor by the user.

**`npm test` → 14/14 passing against the live project.**

| Final check | Result |
|---|---|
| `npm run typecheck` | ✅ zero errors |
| `npx eslint lib/ types/ tests/ vitest.config.mts` | ✅ exit 0 |
| `npm test` | ✅ **14 passed (14)** |
| `npm run lint` (whole repo) | ⚠️ 1 error + 10 warnings, **all pre-existing in `app/`** |

Also renamed `vitest.config.ts` → `.mts` to clear a Vite ESM-in-CJS warning.

### Phase 3 acceptance (spec §7.4)

- [x] All migrations run cleanly from empty — verified on local Postgres 16 **and**
      applied live
- [x] Every table reports `rowsecurity = true` (12/12)
- [~] **`types/database.ts` is hand-written, not generated** — see deviation
- [x] `extracted_leads` columns match `SELECTOR_MAP.md` §3 exactly
- [x] Test proves user A cannot read user B's rows via the anon client
- [x] Test proves a non-admin cannot escalate their own `profiles.role`

### Deviation — types are hand-written

`supabase gen types --db-url` requires **Docker**, which is not installed here.
Generating against the remote project (`--project-id`) requires `supabase login`,
and no access token is available.

The hand-written file matches the migrations exactly, typechecks cleanly, and all
14 tests pass against the live schema. The only thing it lacks is populated
`Relationships` metadata, used by PostgREST for embedded-resource queries —
**this project writes joins explicitly and does not use them.**

To replace with generated types, run `npx supabase login` once, then
`npm run db:types`. Not blocking; worth doing before Phase 7.

### Design notes

- **`extracted_leads` columns come from `SELECTOR_MAP.md` §3**, not the wish-list.
  All parsed fields nullable — 100% presence on one page is not proof.
- **`job_queue` has RLS enabled and no policies** — deliberate. Denies every
  non-service-role client.
- **Privilege escalation is blocked by a trigger, not only a policy.** A policy
  cannot express "row writable but these columns frozen". `protect_profile_columns()`
  reverts `role`, `plan_id`, `access_expires_at`, `suspended_at`, `deleted_at`.
- **`admin_audit_logs` rejects UPDATE/DELETE for every role including service.**
- `lib/supabase/admin.ts` imports `server-only`, so the build fails if it ever
  becomes reachable from a Client Component.

---

## 2026-08-06 — Second real page analysed (parser hardening)

User supplied a second saved page (5 leads). Analysed locally, never committed.

### Findings

1. **`company_name` / `company_url` are genuinely nullable.** One lead's company
   has no LinkedIn company page: no `a[data-anonymize="company-name"]`, no
   `/sales/company/` link anywhere in the row.

2. **🔴 The company name is still present — as a bare text node.** It sits inside
   `div.artdeco-entity-lockup__subtitle`, untagged. The current selector misses
   it entirely.

   **Without a fallback we silently lose the company on ~20% of leads** (1 of 5
   on this page). A fallback rule is now mandatory — see `SELECTOR_MAP.md` §3.
   Verified: no regression on page 1 (25/25 still via anchor), recovers the
   missing company on page 2. `company_url` correctly stays NULL.

3. **The row filter is load-bearing, not defensive.** Page 2 has 25
   `li.artdeco-list__item` elements but only **5 leads** — the remainder are
   sidebar and filter items. Anchoring on `li.artdeco-list__item` alone would
   have produced 20 phantom rows.

4. **Non-ASCII parses correctly** — a German company name containing `ü`
   extracted intact.

5. Lead counts vary widely on the same layout: 25 vs 5.

### `.gitignore` hardened

The new file was named `bad list navigator .html`, which **did not match** the
`*Sales Navigator*.html` rule. Name-based patterns are not reliable.

Now denies `*.html` outright and re-allows only `tests/fixtures/html/**`.
Verified with `git add --dry-run`: a fabricated fixture is trackable, a real page
dropped anywhere else is refused. No `.html` file is tracked in this repo, so the
blanket deny costs nothing.

### Validation status

**2 pages / 30 leads.** Still unverified: a lead with no location, no blurb, or
no job title; "Saved leads" account lists; non-Latin scripts; non-UTF-8 encodings.

---

---

## 2026-08-06 — Phase 4 complete: authentication and access control

### Built

| File | Purpose |
|---|---|
| `supabase/migrations/0008_rate_limits_and_bootstrap.sql` | `rate_limits` table, `consume_rate_limit()`, `increment_usage()`, `sweep_rate_limits()`, `bootstrap_admin()` |
| `lib/errors/catalog.ts` | typed error catalog + `AppError` + `toClientError` |
| `lib/limits/plans.ts` | plan reads, Zod-validated `limits` blob |
| `lib/limits/usage.ts` | usage snapshot + atomic increment |
| **`lib/auth/decide.ts`** | **the access decision as a PURE function** |
| `lib/auth/access.ts` | `getAccessContext` / `requireAccess` / `requireAdmin` / `assert*` |
| `lib/auth/password.ts` | 12-char minimum + deny-list, **no composition rules** |
| `lib/auth/rate-limit.ts` | Postgres-backed limiter, fails **open** |
| `lib/auth/actions.ts` | the six auth flows |
| `proxy.ts` | session refresh + authentication guard |
| `app/(auth)/*` | sign-in, sign-up, verify-email, forgot-password, reset-password |
| `app/auth/callback/route.ts` | code exchange for verification + reset links |
| `app/(product)/*` | authenticated shell, dashboard, access-status page |
| `components/auth/*` | `AuthShell`, `Field`, `FormFeedback`, `SubmitButton` |
| `tests/unit/access-decision.test.ts` | 30 tests over every branch |
| `tests/unit/password.test.ts` | 15 tests |

### Design tokens added (the one permitted `globals.css` edit)

Flagged in advance in `DESIGN_TOKENS.md` §8. **Additive only** — no existing
landing-page value changed: border tokens, radius scale, shadow scale, and
status colors (success / warning / danger / info).

### 🔧 Next.js 16: `middleware` → `proxy`

The build emitted a deprecation notice. Per `AGENTS.md` ("heed deprecation
notices"), read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
and migrated `middleware.ts` → **`proxy.ts`** with the function renamed to
`proxy`. Build is now warning-free.

Next's own docs describe this layer as **"a last resort"** and note it may run
at the CDN edge, separate from render code — which reinforces the existing rule
that it is *not* an authorization boundary.

### Design decision — the access decision is a pure function

`lib/auth/decide.ts` holds `decideAccess()`, which takes `(profile,
emailVerified, limits, usage)` and returns `{canUseScraper, reason}`. No I/O, no
request context, no secrets. `access.ts` gathers inputs and delegates.

Rationale: security logic that cannot be exhaustively tested tends not to be.
All 30 branch tests run in milliseconds with no database.

Precedence, verified by test: **suspended › email_unverified › role › expired ›
payment_required › limit_reached**. Suspension outranks admin.

### Verification

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ zero errors |
| `npx eslint` on all new code | ✅ zero problems |
| `npm test` | ✅ **59 passed (59)** |
| `npm run build` | ✅ clean, **no deprecation warnings** |
| `grep -rn "role ===" app/ components/` | ✅ **none** — no access logic outside `lib/auth/` |
| service-role client imports | ✅ only `lib/`, never `app/` or `components/` |
| Migration 0008 applied locally + idempotent | ✅ |
| Rate limit: 5 allowed, 6th blocked | ✅ (fixed an off-by-one — it blocked the 5th) |
| `increment_usage` atomic | ✅ 1 → 5 |
| `bootstrap_admin` promotes + writes audit row | ✅ |
| `bootstrap_admin` on unknown email raises | ✅ |

### Verified in the browser

- `/sign-in` renders with the aurora treatment and product tokens
- **`/dashboard` while signed out → redirects to `/sign-in?next=%2Fdashboard`**
- Weak password (`password1234`) → rejected with the danger banner,
  **and zero users created** — the check returns before touching Supabase
- Zero console errors

### 🟡 Pending — apply migration 0008

`supabase/migrations/0008_rate_limits_and_bootstrap.sql` is verified locally but
**not yet applied to `ptewhpmxzenbmxlizxhu`**. Until it is, rate limiting
**fails open** (deliberate — a broken limiter must not lock everyone out) and
`increment_usage` will error when first called.

Paste that one file into the SQL Editor, or re-paste `APPLY_ALL.sql` (idempotent).

### First admin

There is no self-service path. After signing up and verifying your email, run
once in the SQL Editor:

```sql
select public.bootstrap_admin('husnain@outlio.io');
```

---

## 2026-08-06 — Required contact fields at sign-up (user request)

Phone number and LinkedIn profile URL are now **required to create an account**,
so a human can vet an access request before approving it.

### Built

| File | Change |
|---|---|
| `supabase/migrations/0009_profile_contact_fields.sql` | `profiles.phone`, `profiles.linkedin_url`, format CHECKs, updated `handle_new_user()` |
| `lib/auth/profile-fields.ts` | `normalizePhone`, `normalizeLinkedInUrl`, `normalizeFullName` — pure |
| `lib/auth/actions.ts` | sign-up now requires and normalises all three |
| `app/(auth)/sign-up/SignUpForm.tsx` | phone + LinkedIn fields with hints |
| `types/database.ts` | `ProfileRow.phone`, `ProfileRow.linkedin_url` |
| `tests/unit/profile-fields.test.ts` | 23 tests including hostile input |

### ⚠️ This does NOT weaken CLAUDE.md rule 1

`profiles.linkedin_url` is the **account holder's own** profile, self-supplied at
sign-up for manual vetting. It is stored as a string and **never fetched,
visited, or scraped**. It is not lead data. No request to `linkedin.com` exists
anywhere in the codebase.

### Design decisions

**Phone is E.164, country code required.** No default region is assumed —
guessing silently corrupts numbers for anyone outside it, and the customer base
is international. Also avoids a ~145 KB libphonenumber dependency for one field.
Common formatting (spaces, dashes, dots, parens) and a `00` prefix are accepted
and normalised.

**LinkedIn URL is canonicalised** to `https://www.linkedin.com/in/{slug}`.
Accepts bare domains, missing protocol, regional subdomains, trailing slashes,
query strings, and locale path prefixes. Rejects company pages, school pages,
and Sales Navigator links with a **specific** reason for each.

**Columns are NULLABLE in the database** despite being required at sign-up.
Users created out-of-band — by an admin in the Supabase dashboard, or by the
integration test suite — carry no sign-up metadata. `NOT NULL` would break admin
user creation for no security gain, since enforcement that matters is in the
sign-up flow. Format CHECKs still apply whenever a value is present.

### 🐛 Security gap caught by a hostile test

`https://www.linkedin.com/in/<script>` was **accepted**. `new URL()`
percent-encodes it to `%3Cscript%3E`, and the slug pattern allowed `%` in order
to support international names (`müller` → `m%C3%BCller`).

**Fix:** decode the slug first, then validate the DECODED form against a
unicode-aware `^[\p{L}\p{N}_-]{2,100}$`, and re-encode for storage. Unicode
letters pass; structural characters do not. Regression tests added for
`%3Cscript%3E`, `%2E%2E%2F`, `%20`, `%00`, and malformed `%zz`.

### Verification

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ zero errors |
| `npx eslint` (all new code) | ✅ zero problems |
| `npm test` | ✅ **82 passed (82)** |
| `npm run build` | ✅ clean, zero warnings |
| Migration 0009 applied locally + idempotent | ✅ |
| Trigger copies metadata into `profiles` | ✅ all three fields |
| CHECK rejects malformed phone / phone without `+` | ✅ |
| CHECK rejects a company URL | ✅ |
| CHECK still allows NULL (admin-created users) | ✅ |

### ✅ Verified in the browser — 2026-08-07

Migration 0009 applied live by the user. Sign-up form confirmed end to end:

- All five fields render with hints and placeholders
- Phone without a country code → *"Include your country code, starting with +…"*
- LinkedIn company URL → *"That is a company page. Use your personal profile URL,
  which contains /in/."*
- **No account created** by any rejected attempt

### 🐛 Three defects found and fixed while verifying

**1. `readCounter` dumped an entire HTML page into the error message.**
Supabase went down mid-session (Cloudflare 522). Supabase surfaces upstream
failures with the origin's HTML body as `error.message`, so the thrown Error
carried a full Cloudflare error page — flooding logs and, had it ever reached a
response, leaking infrastructure detail. Now truncated to one line via
`concise()`, with `<`-prefixed bodies collapsed to `upstream returned HTML`.

**2. `getAccessContext` fetched plan + usage for users who could never pass.**
The same outage 500'd `/verify-email` and `/sign-up` — pages that only needed to
know whether anyone was signed in. Split `decideAccess` into `precheckAccess`
(profile only) and `decideLimits` (plan + usage). Pre-checks run first, so plan
and usage are fetched **only** when a user has otherwise qualified.
Two fewer round trips for denied users, and a usage-table outage can no longer
take down sign-in or verify-email.

**3. 🔴 React 19 resets uncontrolled form fields after a form action.**
One mistyped field wiped the entire sign-up form — name, email, phone, LinkedIn
URL and password all cleared. Fixed by echoing submitted values back on the
error state and restoring them via `defaultValue`. **The password is never
echoed**, and is correctly the only field cleared. Applied to sign-in too.

### 🔧 Turbopack workspace root

`next dev` and `next build` warned on every run: a stray
`~/package-lock.json` (an accidental `npm install` in the home directory, Feb
2026) made Turbopack infer `~` as the workspace root, broadening filesystem
watching. Fixed project-locally by pinning `turbopack.root` in `next.config.ts`
per the bundled docs. **Nothing outside the repo was modified** — the stray
lockfile is still there and is the user's to remove.

### Verification

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ zero errors |
| `npx eslint` (all new code) | ✅ zero problems |
| `npm test` | ✅ **82 passed (82)**, 4 files |
| `npm run build` | ✅ clean, zero warnings |
| Sign-up validation live | ✅ specific errors, values retained, password cleared |
| Accounts created by rejected attempts | ✅ **zero** |

---

---

## 2026-08-07 — Phase 5 complete: access requests, entitlements, payments

### Built

| File | Purpose |
|---|---|
| `supabase/migrations/0010_entitlements_and_invitations.sql` | `grant_entitlement()`, `revoke_entitlement()`, `redeem_invitation_code()` |
| `supabase/migrations/0011_audit_logs_survive_user_deletion.sql` | drops FKs that blocked account deletion |
| `lib/payments/provider.ts` | `PaymentProvider` interface + `NotConfiguredError` |
| `lib/payments/manual.ts` | **fully implemented** — records a `payment` access request |
| `lib/payments/stripe.ts` | real compiling class, every method throws `NotConfiguredError` |
| `lib/payments/registry.ts` | selection by `PAYMENT_PROVIDER`; swapping needs no change elsewhere |
| `lib/payments/grant.ts` | `grantEntitlement` / `revokeEntitlement` / `redeemInvitationCode` |
| `lib/access/actions.ts` | four request flows, each rate-limited |
| `components/access/RequestOptions.tsx` | the four options |
| `app/(product)/dashboard/access/page.tsx` | status + options, per-reason copy |
| `tests/integration/invitations.test.ts` | 8 tests incl. the concurrency criterion |

### Design decisions

**Entitlement granting is a Postgres function, not application code.** A grant
touches `profiles`, `subscriptions`, `access_requests` and `admin_audit_logs`.
Splitting that across round trips would let it half-apply. `grant_entitlement()`
is the single path every provider, the invitation flow, and the admin panel call.

**Redemption atomicity comes from one guarded UPDATE**, not a read-then-write:
`update ... where used_count < max_uses`. Postgres serialises concurrent writers
on the row, so exactly one caller observes each transition.

**`invalid` and `unavailable` are distinguished for logs only.** The UI shows one
generic message so redemption cannot become a code-enumeration oracle.

### 🐛 Two real bugs found by testing under concurrency

**1. Multi-use codes silently behaved as single-use.**
`redeem_invitation_code` passed the *invitation code's id* as
`subscriptions.provider_ref`, colliding with the
`subscriptions_provider_ref_uniq (provider, provider_ref)` index. With
`max_uses = 3`, the 2nd and 3rd redeemers failed on a unique violation.
Fixed by composing `{code_id}:{user_id}` — preserving the Stripe guarantee
(one subscription per provider reference) while allowing a code to serve
`max_uses` distinct users.

**2. 🔴 Users with audit rows could not be deleted at all.**
`admin_audit_logs.admin_id` was `references auth.users on delete set null`.
Postgres implements SET NULL as an UPDATE, which the append-only trigger from
0007 correctly refused:

```
ERROR: Table public.admin_audit_logs is append-only; UPDATE is not permitted
```

So `delete from auth.users` failed for anyone who appeared in an audit row —
breaking account deletion and the GDPR right to erasure. Migration 0011 drops
those FKs and keeps plain uuid columns, which is the correct design for an
append-only log: it must outlive the rows it describes, and "who did this?" must
stay answerable after the actor's account is gone. Verified that append-only
enforcement still holds afterwards.

Neither bug is reachable by sequential testing. Both needed genuinely parallel
connections.

### Verification

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ zero errors |
| `npx eslint` (all new code) | ✅ zero problems |
| `npm run build` | ✅ clean, zero warnings |
| Migrations 0010 + 0011 local, idempotent | ✅ |
| **10 parallel redemptions, `max_uses=1`** | ✅ **exactly 1 ok**, `used_count=1`, 1 subscriber |
| **12 parallel redemptions, `max_uses=3`** | ✅ **exactly 3 ok**, `used_count=3`, 3 subscribers, 3 subscription rows |
| Expired / inactive code → `unavailable` | ✅ |
| Already-entitled user → `already_active` | ✅ |
| Grant writes subscription + audit row | ✅ |
| User with audit rows can be deleted | ✅ (was broken) |
| Audit log still append-only after 0011 | ✅ |

Also configured `@typescript-eslint/no-unused-vars` to honour the leading-underscore
convention — interface implementations must accept parameters they do not use.

### ✅ Migrations 0010 + 0011 applied live — 2026-08-07

Verified by RPC probe, then the full suite run against the project.

**`npm test` → 90/90 passing against `ptewhpmxzenbmxlizxhu`.**

Migration 0011 confirmed working in production: six test users carrying
`entitlement.grant` audit rows were deleted successfully. That delete would have
failed before the fix.

### Test-suite fixes found while running against the real project

**1. Unnecessary sign-ins were tripping Supabase's per-IP token rate limit.**
`createTestUser` signs a user in, but the invitation tests drive everything
through service-role RPCs and never need an authenticated client. ~24 sign-ins
per run hit the limit and produced empty-message failures. Added
`createAuthUser()` (create, no sign-in) and switched the invitation suite to it.
Side effect: suite runtime dropped from **122s → 28s**.

**2. A failed sign-in leaked the user it had just created.**
`createTestUser` threw before the caller learned the id, so no `afterAll` could
remove it — six orphaned users and eight orphaned codes accumulated in the live
project. The error path now deletes the user before throwing, and the message
explains the rate-limit cause.

**3. `afterAll` exceeded Vitest's 10s default hook timeout**, deleting ~20 users
sequentially. A timed-out cleanup hook silently leaves orphans. Cleanup is now
`Promise.allSettled` in parallel — settled, not all, so one failed delete cannot
abandon the rest — and `hookTimeout` is raised to 60s.

Live project swept clean afterwards: 1 user (`husnain@outlio.io`), 0 test codes,
0 subscriptions.

---

## 2026-08-07 — Phase 6: upload pipeline

### Built

| File | Purpose |
|---|---|
| `supabase/migrations/0012_storage_policies.sql` | `storage.objects` RLS — own-prefix only |
| `lib/upload/sniff.ts` | content sniffing, 20 binary signatures, encoding detection |
| `lib/upload/storage-key.ts` | server-generated keys, filename sanitisation |
| `lib/upload/limits.ts` | effective limits = stricter of plan and service |
| `lib/upload/process.ts` | validation order + job creation |
| `lib/upload/actions.ts` | the upload Server Action |
| `components/upload/UploadForm.tsx` | drag-drop, per-file list, consent gate |
| `app/(product)/dashboard/extract/new/page.tsx` | the upload screen |
| `tests/unit/upload-sniff.test.ts` | 34 tests |
| `tests/unit/storage-key.test.ts` | 21 tests |

### Storage bucket created

Private `uploads` bucket created via the Storage API: `public: false`,
10 MB `file_size_limit`, `allowed_mime_types: ["text/html"]`.

### Design decisions

**Extension and MIME are checked, but only as hints.** Both are attacker-
controlled. They run first purely because they are cheap and produce a clearer
message than a sniff failure. The decision is made by bytes.

**Encoding is detected, not assumed.** A page saved as UTF-16 is valid HTML whose
bytes read as `<\0h\0t\0m\0l\0`; a hardcoded UTF-8 decode finds no markers and
would reject it. That is exactly defect G3 in the original scraper
(`SCRAPER_AUDIT.md`), so the sniffer detects BOMs and infers UTF-16 from
interleaved NULs.

**Storage keys are structurally incapable of traversal.** All three components
are validated as UUIDs before the key is built, so the result can only ever
match `^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.html$`. A hostile filename
cannot influence it because the filename is never an input.

**Two different filename sanitisers, deliberately.** `sanitizeDisplayFilename`
is permissive — it is a display string, and mangling the user's filename is
worse than showing it, since nothing executes it. `sanitizeExportFilename` is
strict `[A-Za-z0-9._-]` because that value does reach a `Content-Disposition`
header.

**Size is measured from the bytes actually held**, never `file.size`, which the
client controls.

### Verification

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ zero errors |
| `npx eslint` (all new code) | ✅ zero problems |
| `npm test` | ✅ **145 passed (145)** |
| `npm run build` | ✅ clean, zero warnings |
| **`.exe` (PE header) named `.html` rejected** | ✅ `ERR_FILE_TYPE` |
| 15 binary signatures rejected | ✅ ZIP, PDF, ELF, PNG, GIF, JPEG, GZIP, RAR, 7z, Mach-O, class, Office, SQLite, WASM |
| 0-byte and whitespace-only rejected | ✅ `ERR_FILE_EMPTY` |
| Valid HTML but not a results page | ✅ `ERR_FILE_FORMAT` |
| UTF-16LE HTML with BOM accepted | ✅ |
| NUL inside UTF-8 rejected | ✅ |
| HTML only after the 4 KB window rejected | ✅ |
| **`../`, NUL, `; rm -rf /`, `$(id)` cannot reach a key** | ✅ throws |
| Prefix-collision `{uuid}-evil/…` rejected | ✅ |

### Storage privacy verified against the live bucket

| Attempt | Result |
|---|---|
| Anonymous GET, no key | **HTTP 400** — denied |
| GET via the public path | **HTTP 400** — denied |
| GET with the publishable (anon) key | **HTTP 400** — denied |
| GET with a 60s signed URL | **HTTP 200** ✅ |

That is spec §10.4's "unreachable without a signed URL", proven end to end. The
probe object was deleted afterwards.

### ✅ Migration 0012 applied live — 2026-08-07

**Gotcha for future storage migrations:** `alter table storage.objects enable row
level security` fails from the SQL Editor with

```
ERROR: 42501: must be owner of table objects
```

because `storage.objects` is owned by `supabase_admin`, not the `postgres` role
the editor runs as. Supabase enables RLS there by default, so the statement was
only an assertion — it was removed. Creating and dropping POLICIES is permitted,
which is all that is needed. The migration now carries a comment explaining this
so nobody adds the line back.

### Storage policies verified behaviourally, with a real user session

| Test | Result |
|---|---|
| User reads **own** prefix | **200** ✅ |
| User reads **another user's** prefix | **400** denied ✅ |
| User **deletes** another user's object | **400** denied ✅ |
| Bare anon key, no session | **400** denied ✅ |
| Victim's object still present afterwards | **200** ✅ |

The last row matters most: it proves the delete was blocked by policy rather
than erroring while succeeding. Test user and objects removed afterwards.

### Not yet built (Phase 7)

The upload creates an `extraction_jobs` row with status `uploaded` and stores the
files, but **nothing processes them yet** — no `job_queue` row is enqueued and no
worker exists. The upload screen is honest about this; the jobs list arrives with
the worker.

---

## 2026-08-07 — Phase 7: parser, queue, worker, CSV

### Architecture change — worker deployment (at ~5 users)

Railway deferred on cost. **The queue is unchanged**: `job_queue`,
`FOR UPDATE SKIP LOCKED`, claims, attempts, backoff all identical. Only the
trigger differs — `after()` on the upload request instead of a container loop.
`lib/worker/process-job.ts` is deployment-agnostic; moving to Railway means
calling `claimAndProcessOne()` from a loop instead of from `after()`.

**Consequence:** a Vercel function timeout can cut `after()` short, leaving a job
`claimed` forever. `reap_stale_jobs()` is therefore not optional — it is the only
thing that recovers a stalled job without an always-on worker.

### Built

| File | Purpose |
|---|---|
| `supabase/migrations/0013_queue_and_retention.sql` | `enqueue_job`, `claim_next_job`, `reap_stale_jobs`, `purge_job_leads`, `lead_keys` |
| `lib/leads/parse.ts` | cheerio parser from `SELECTOR_MAP.md` |
| `lib/leads/canonical-url.ts` | URL canonicalisation |
| `lib/leads/dedupe.ts` | 5 strategies, 4 modes, cross-job keys |
| `lib/export/sanitize.ts` | **the single** `sanitizeCell` + RFC 4180 CSV |
| `lib/worker/process-job.ts` | per-file isolation, idempotent persist, CSV build |
| `lib/jobs/actions.ts` | signed download URL, purge |
| `components/jobs/JobActions.tsx` | download + clear buttons |
| `app/(product)/dashboard/jobs/page.tsx` | jobs list |
| `tests/fixtures/html/*` | 8 fabricated fixtures incl. hostile set |
| `tests/unit/parse.test.ts` | 40 tests |

### Product decision — CSV-first, no leads table

Per the user: leads are delivered as a **CSV download**, not browsed in a table,
and the data is cleared once they have it.

**`lead_keys` retains only the opaque dedupe key** after a purge — no name,
company, URL or blurb. Cross-job duplicate detection survives at ~8% of the
storage, and it is a privacy improvement rather than a compromise. Verified:
7 leads purged → 0 lead rows, 7 keys retained, re-purge bumps `seen_count`.

### Profile URL — resolved

The public `linkedin.com/in/` URL is **not** in the saved HTML (0 occurrences of
`/in/`, `publicIdentifier`, `vanityName` across both real pages). But each row
carries `urn:li:fs_salesProfile:(ACwAA…)` — and that identifier is **identical**
to the `/sales/lead/` id (25 distinct from each, same set).

LinkedIn accepts a member URN in the `/in/` path, so
`https://www.linkedin.com/in/{memberUrn}` is built from data already extracted —
no request to linkedin.com, no guessing. **Awaiting user confirmation that these
resolve**; if not, fall back to the Sales Nav URL.

⚠️ The page also contains `urn:li:member:{id}` — the ACCOUNT HOLDER's own member
id, in A/B-test config. Never parsed, never stored.

### 🐛 Four bugs found by testing

1. **Tenure split broke on node boundaries.** Extraction walked child text nodes,
   so it worked on real pages (two nodes) but not fixtures (one node). Rewritten
   to parse the combined string — node boundaries are an implementation detail.
2. **`\b` after `"in role"` silently returned null** when the halves are welded:
   the next char is a digit, and `e`→`3` is not a word boundary.
3. **`claim_next_job`: ambiguous `attempts`** — `RETURNS TABLE` declares an OUT
   parameter of the same name as the column. Qualified as `public.job_queue.attempts`.
4. **`reap_stale_jobs`: enum cast** — a bare `'failed'` in a CASE is text and
   will not coerce into `queue_status`. Added `::public.queue_status`.

Bugs 3 and 4 were unreachable without executing the SQL.

### Verification

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ zero errors |
| `npx eslint` | ✅ zero problems |
| `npm test` | ✅ **185 passed** |
| `npm run build` | ✅ clean |
| Real page 1 | ✅ 25 leads, all 10 fields 25/25 |
| Real page 2 | ✅ 5 leads, company **5/5** via fallback, companyUrl **4/5** |
| Job-title trap | ✅ title never starts with a digit; tenure split both shapes |
| Two workers claim different jobs | ✅ SKIP LOCKED |
| Stale claim reaped with backoff | ✅ 2 reaped, `attempts+1`, future `next_attempt_at` |
| Dead letter past `max_attempts` | ✅ queue+job `failed`, `ERR_TIMEOUT` |
| Purge retains keys only | ✅ 7 → 0 leads, 7 keys, no PII columns |
| `=cmd\|'/c calc'!A1` neutralised | ✅ `'=cmd\|…` |
| Hostile fixtures rejected | ✅ binary, div bomb, empty, zero-results |

### 🟡 Pending — apply migration 0013

`supabase/APPLY_PENDING.sql` (218 lines). Uploads will queue but never process
until it is applied — `enqueue_job` and `claim_next_job` do not exist yet.

### Not yet built

- Scheduled reaper invocation (currently only callable, not called on a timer)
- XLSX export (CSV only)
- Admin dashboard (Phase 11)

---

## 2026-08-08 — Phase 8: made it actually usable

Phase 7 finished with a working pipeline that **could not be used**. Three gaps:

1. **`/admin` did not exist** — the product layout linked to it for admins, so
   the only admin account got a 404.
2. **No navigation** — nothing linked `/dashboard` to `/dashboard/jobs` or
   `/dashboard/extract/new`. Every route was reachable only by typing a URL.
3. **Nothing called `reap_stale_jobs()`** — it existed but ran on no schedule,
   so a stalled job stayed stalled forever.

And the one that actually blocked the business model: **access is
manual-approval only, but there was no UI to approve anyone.** Users could
request access; granting it required hand-written SQL.

### Built

| File | Purpose |
|---|---|
| `components/product/ProductNav.tsx` | primary nav with `aria-current` |
| `lib/admin/actions.ts` | approve / revoke / suspend, all `assertAdmin()` |
| `components/admin/UserRow.tsx` | per-user admin controls |
| `app/admin/layout.tsx` | admin shell, `requireAdmin()` |
| `app/admin/page.tsx` | users, pending requests, audit log |

Also: dashboard now links to upload and jobs (the old copy still said "upload is
not available yet", which was stale), and the jobs page calls
`reap_stale_jobs()` on load.

### Design decisions

**The reaper runs on jobs-page load, not a cron.** Viewing the jobs list is the
moment a stuck job matters to someone. One indexed UPDATE, idempotent, and it
needs no scheduler on the free tier. Failures are swallowed — a reaper that
cannot run must not break the page.

**`requireAdmin()` is called in the layout AND every page AND every action.**
A layout is not an authorization boundary: Next can render a route without
re-running a parent layout on some navigations, and Server Actions never pass
through layouts at all.

**Admins cannot revoke or suspend themselves** — that would lock the only admin
out of the page that grants access.

### Verification — signed in as a real admin

Session obtained by minting a magic link with the service-role key; no password
was handled.

| Route | Result |
|---|---|
| `/dashboard` | 200, nav renders, usage cards |
| `/dashboard/extract/new` | 200, dropzone + consent gate |
| `/dashboard/jobs` | 200 |
| `/admin` | 200 |
| Signed out → `/dashboard` | redirects to `/sign-in?next=…` |

**The admin page showed a REAL pending request** — a second user had signed up
and requested a sales call. Signup → access request → admin review works
end to end for a real person, not just in tests.

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ zero errors |
| `npx eslint` | ✅ zero problems |
| `npm test` | ✅ **185 passed** |
| `npm run build` | ✅ clean, 19 routes |
| `grep "role ===" app/ components/` | 1 hit, annotated as presentation-only |
| service-role importers | all server modules; none client-reachable |

### Still not built

- Compliance pages `/acceptable-use`, `/data-processing` (spec §13.3)
- Security headers: CSP, HSTS, `Referrer-Policy` (spec §13.1)
- XLSX export (CSV only)
- `npm audit`: 3 high-severity in `sharp`, needs Next 16.2.10 → 16.3.0
- Admin: job inspection, invitation-code management, system events

### Open questions for the user

1. **Do `linkedin.com/in/{memberUrn}` URLs resolve?** Every CSV row depends on it.
2. **Lead List page DOM** — the parser targets search results and will reject a
   lead-list page with `ERR_FILE_FORMAT`.

---

## 2026-08-08 — Lead Engine marketing page

### Built

| File | Purpose |
|---|---|
| `app/leadengine/page.tsx` | product landing page at `/leadengine` |
| `components/leadengine/StudioHero.tsx` | hero wrapper, dynamic import |
| `components/ui/volumetric-studio.tsx` | 3D volumetric spotlight room |
| `lib/utils.ts` | `cn()` — clsx + tailwind-merge |

Nav gained a **"Try Outlio's Lead Engine"** button (desktop + mobile).

### ⚠️ Landing page modified — rule 5 exception

`CLAUDE.md` rule 5 says the landing page is read-only. The user explicitly asked
for this nav button, which is their call to make. **Only `Nav.tsx` was touched**,
and only to add two links. No other landing-page file was changed.

### Design decisions

**Beams tinted to `rgb(196,198,255)`** — a desaturated lift of `--accent`
(#4f4bff). A literal accent reads as a stage gel rather than light. The room
stays black because the volumetric effect requires darkness; it works as
deliberate contrast against the paper-white marketing pages, and every section
below the hero returns to the normal Outlio palette.

**three.js is dynamically imported with `ssr: false`.** It is ~25 MB unpacked and
lands in a 908 KB chunk. Verified: **the homepage does not reference that chunk
at all.** The volumetric spotlights also need WebGL, which does not exist during
SSR.

**Reveal timings compressed from 1.6–2.3s to 0.45–1.0s**, and the flicker from
~1.8s to ~0.73s. The headline was gated behind the flicker; content invisible for
over two seconds reads as a broken page.

**Reduced motion resolved in initial state, not an effect.** Setting it inside an
effect renders dark then immediately re-renders lit — a cascading render, and a
visible flash for exactly the users who asked for less movement.

### Pricing published

| Plan | Price | Limits |
|---|---|---|
| Free trial | $0, 1 day | **5 extractions**, all features, no card |
| Lead Engine | **$40/month** | Unlimited extractions, 100 files/batch |

⚠️ These are **marketing copy only**. `plans.limits` in the database still holds
the Phase 3 PLACEHOLDER values and does NOT match. Seeding a real `$40 unlimited`
plan and a `5-extraction / 1-day` trial is outstanding.

### Verification

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ zero errors |
| `npx eslint` | ✅ zero problems |
| `npm test` | ✅ 185 passed |
| `npm run build` | ✅ `/leadengine` static, 20 routes |
| three.js in homepage bundle | ✅ **0 references** |
| Pricing/product copy server-rendered | ✅ present in initial HTML |

One transient test failure occurred on a live-Supabase integration run and did
not reproduce.

### Not done — `app.outlio.io` subdomain

Requires DNS + Vercel domain config (user), then a `proxy.ts` rewrite and an
auth-cookie domain decision (me). See the handover notes.

---

### Superseded — Phase 6 plan

1. `/dashboard/extract/new` — drag-and-drop, per-file progress, consent checkbox
2. Server validation in order: auth → limits → count/size → extension+MIME →
   **content sniffing** → sha256 → server-generated storage key
3. Private `uploads` bucket, signed URLs only
4. Hostile fixture tests: `.exe` renamed `.html`, 0-byte, `../` in filename,
   null bytes, oversized

---

### Superseded — Phase 5 plan

1. `lib/payments/provider.ts` interface + `ManualProvider` (fully implemented)
   + `StripeProvider` throwing `NotConfiguredError` (real, compiling, not a stub)
2. `grantEntitlement()` — one path every provider and the admin panel call
3. Access-request submission form on `/dashboard/access`
4. Invitation codes: constant-time compare, atomic redemption
5. Test: concurrent redemption of a `max_uses = 1` code succeeds exactly once

---

### Superseded — Phase 4 plan

1. `lib/auth/access.ts` — `getAccessContext()`, `requireAccess()`, `requireAdmin()`.
   **The single source of access truth.** Nothing else decides access.
2. `middleware.ts` — session refresh and an authentication guard only.
   Authorization happens in the route; middleware is convenience, not a boundary.
3. Six auth flows: sign-up with email verification, sign-in, password reset,
   sign-out, resend verification, session refresh
4. Rate limiting: 5 attempts / 15 min per IP+email, generic errors that do not
   reveal whether an account exists
5. Admin bootstrap via `ADMIN_BOOTSTRAP_EMAIL` — no self-service path to admin
6. Tests: `registered_user` gets 403 on protected routes; suspended and expired
   accounts blocked with **distinct `reason` values**

Phase 4 needs nothing further from the user.
