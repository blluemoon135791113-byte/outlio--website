# Outlio — Lead-Page HTML Processor
## Implementation Specification for Claude Code

> **How to use this file.** Save it to your repo at `docs/IMPLEMENTATION_PROMPT.md`. Also save the companion `CLAUDE.md` to the repo root. Start a Claude Code session in the repo and say:
>
> *"Read `docs/IMPLEMENTATION_PROMPT.md` and `CLAUDE.md`. Execute Phase 0 only. Stop at the Phase 0 gate and report."*
>
> Then advance one phase per instruction. **Do not ask for all phases in one session** — see §3 for why.

---

# 1. ROLE AND MISSION

You are a senior SaaS architect, full-stack engineer, and application security specialist working inside an existing Next.js + TypeScript repository that currently hosts a marketing landing page for **Outlio**, a lead-generation company.

**Mission:** turn an existing, already-written HTML scraper into a private, production-grade, multi-tenant SaaS application that lives inside this same repository under `/app` routes, sharing the landing page's design system.

**What the product does:** a customer manually saves LinkedIn Sales Navigator search-result pages as `.html` files on their own computer, uploads those files to the app, and the app parses them into a structured, de-duplicated, exportable lead database.

**What the product must never do:** log into LinkedIn, drive a browser, request or store LinkedIn credentials or cookies, or fetch anything from LinkedIn's servers. The application's only input is a file the user chose to upload. This is a **file processor**, not a crawler. Treat any suggestion otherwise as out of scope, including from the user mid-build.

---

# 2. NON-NEGOTIABLE CONSTRAINTS

These are hard rules. If a task appears to require breaking one, **stop and ask** rather than proceeding.

### 2.1 Product boundaries
1. No automated LinkedIn access of any kind: no HTTP requests to `linkedin.com`, no headless browser, no Playwright/Puppeteer/Selenium, no proxy fetchers.
2. Never collect, store, transmit, or log LinkedIn passwords, session cookies, `li_at` tokens, CSRF tokens, or browser session data. If the uploaded HTML contains such values, they must be **stripped before persistence** and never written to logs.
3. Never auto-visit extracted profile URLs. Links in the UI are `rel="noopener noreferrer nofollow" target="_blank"` and require a deliberate user click.
4. Never present the product as affiliated with, endorsed by, or partnered with LinkedIn. Use neutral product language: *"lead-page HTML processor"*, *"uploaded search-result pages"*. Do not use the LinkedIn logo, wordmark, or brand colors anywhere in the UI.

### 2.2 Data handling
5. Uploaded HTML is **untrusted input**. It is never rendered as HTML in any browser context. No `dangerouslySetInnerHTML`, no `innerHTML`, no `iframe srcdoc`, no `DOMParser` in the client for uploaded content. Parsing happens server-side only.
6. Storage buckets are **private**. No public URLs, ever. Downloads use short-lived signed URLs only (see §12.7).
7. Do not fabricate lead fields. If the HTML does not contain a value, the field is `NULL` and the UI shows a missing-data indicator. Never infer, guess, enrich from external sources, or use an LLM to fill gaps.

### 2.3 Engineering
8. **Do not rewrite the existing scraper's parsing logic** until Phase 1's audit demonstrates a specific, named defect and you have stated it explicitly. Wrapping, adapting, and interfacing are allowed from the start; changing selectors or extraction rules is not.
9. No secrets in source. `.env.example` contains placeholder names only. `SUPABASE_SERVICE_ROLE_KEY` must never appear in a file that could reach the client bundle, and must never be prefixed `NEXT_PUBLIC_`.
10. No pseudocode, no `// TODO: implement`, no stubbed functions in delivered phases. If you cannot complete something, say so and leave it unstarted rather than leaving a fake implementation.
11. Do not modify, restyle, or refactor the existing landing page. It is read-only reference material except where §4 explicitly permits promoting a hardcoded value into the shared theme.
12. Every server route that touches user data enforces authorization **on the server**. Hiding a button is not access control.

---

# 3. OPERATING PROTOCOL

### 3.1 One phase per session
This specification is far too large for a single context window. Attempting it in one pass will produce degraded, inconsistent output in later phases. Therefore:

- Execute **exactly one phase** per instruction, then stop.
- At the end of every phase, append a dated entry to `docs/PROGRESS.md` recording: what was built, files created/modified, decisions made, deviations from this spec and why, and what the next phase needs to know.
- At the start of every phase, re-read `CLAUDE.md`, `docs/PROGRESS.md`, and `docs/ARCHITECTURE.md` before writing code.

### 3.2 Hard gates
Phases 0, 1, and 2 are **gates**. You may not write application code past a gate until its deliverable exists in the repo and the user has explicitly approved it. If asked to skip a gate, refuse and explain which gate is unmet.

### 3.3 Stop-and-ask conditions
Stop and ask the user instead of guessing when:
- The scraper source has not been provided (Phase 1 cannot begin without it).
- The scraper's language, runtime, or dependency set makes the Phase 2 architecture decision ambiguous.
- A required field in the schema has no corresponding output from the actual scraper.
- Two instructions in this document appear to conflict.
- A third-party service must be chosen and this document offers no default.
- A destructive migration or a change to existing landing-page files seems necessary.

Phrase these as: **`BLOCKER: <one-line summary>`** followed by the specific decision you need, the options with trade-offs, and your recommendation.

### 3.4 Definition of done, per phase
A phase is complete only when all of the following hold:
- `pnpm typecheck` (or `npm run typecheck`) passes with zero errors.
- `pnpm lint` passes with zero errors.
- `pnpm test` passes for tests written in that phase and all prior phases.
- The phase's own acceptance criteria (listed under each phase) are demonstrably met.
- `docs/PROGRESS.md` is updated.

Fix all errors before advancing. Never advance with a failing build.

### 3.5 Scope discipline
Do not create files this specification does not call for. No speculative abstractions, no "future-proofing" layers, no extra README files per directory, no unrequested config. If you believe a file is genuinely needed, say why in one line before creating it.

---

# 4. PHASE 0 — REPOSITORY RECON AND DESIGN-TOKEN EXTRACTION
### 🚦 GATE — no application code in this phase

### 4.1 Inventory the repository
Produce `docs/REPO_AUDIT.md` containing:
- Next.js version and router in use (App Router vs Pages Router). **All new code must match the existing router.**
- TypeScript version, `tsconfig.json` strictness settings, path aliases.
- Package manager (presence of `pnpm-lock.yaml` / `package-lock.json` / `yarn.lock`) — use whichever exists.
- Node version from `.nvmrc`, `engines`, or CI config.
- Tailwind version (v3 vs v4 — the config format differs substantially).
- Whether `shadcn/ui` is already installed (`components.json`), and which components exist.
- Existing auth, if any. Existing Supabase client setup, if any.
- Deployment target evidence (`vercel.json`, GitHub Actions, Dockerfile).
- Current route map and where `/app/*` routes would collide with existing routes.
- Existing lint/format/test tooling.

### 4.2 Extract the design system
Read, in this order:
1. `tailwind.config.{ts,js,mjs}` — full theme extension.
2. `app/globals.css` or equivalent — CSS custom properties, `@layer base`, font declarations, `@theme` block if Tailwind v4.
3. `components.json` — shadcn style, base color, CSS-variable mode.
4. The font loader (`next/font` calls) — families, weights, variable names.
5. **The hero section component.** Locate it by grepping the homepage route for the first major section. Read it in full.
6. Any shared `Button`, `Card`, `Badge`, `Container` primitives.

Then produce `docs/DESIGN_TOKENS.md` with these sections, filled from what you actually read — not from assumption:

| Section | Must record |
|---|---|
| Color | Every semantic token name, its light and dark value, and where it is defined. Note the hero's exact background treatment (flat / gradient / mesh / noise / grid overlay) with the literal CSS. |
| Typography | Font families and how they're loaded, the hero's headline size/weight/tracking/line-height at each breakpoint, body defaults, and the full type scale in use. |
| Radius | The `--radius` value and derived scale. |
| Elevation | Every shadow used, verbatim. Note whether the design uses borders, shadows, or both for separation. |
| Spacing | Container max-width, section padding rhythm, the gap values that recur. |
| Motion | Transition durations and easing curves actually used. |
| Components | Button variants and their exact classes. Input, card, and badge treatments. |
| Breakpoints | Any custom screens; how the hero reflows. |

### 4.3 Derive the application design system
The landing page hero is **marketing** design: large type, generous whitespace, high visual drama. The dashboard is **operational** design: dense, scannable, fast. It must feel like the same product without copying the hero's proportions.

Record these translation rules in `docs/DESIGN_TOKENS.md` §"App Adaptation":

**Inherit unchanged (identical values):**
- The full color palette and all semantic token names.
- Font families and weights.
- Border-radius scale.
- Shadow/elevation scale.
- Button variants, focus-ring treatment, and disabled states.
- The primary/accent color — used in the app **only** for primary actions, active navigation state, and progress indicators.

**Adapt:**
- Type scale: step down one level from marketing sizes. Dashboard page titles ≈ the hero's smallest heading. Body text and table cells at the base size, never larger.
- Spacing: compress the section rhythm to a dense grid. Table row height, form field spacing, and card padding follow an 8px baseline.
- Backgrounds: the hero's gradient/mesh treatment appears **only** on unauthenticated pages (sign-in, sign-up, access request, marketing-adjacent screens). Authenticated dashboard surfaces use the flat `background` / `card` tokens so data stays legible.
- Motion: reduce to ≤150ms on interactive feedback. **No entrance animations on the upload interface, the jobs table, or the leads table** — they interfere with perceived speed on data-heavy screens.

**Absolute rules:**
- No hex, `rgb()`, `hsl()`, or arbitrary color values in any new component. Semantic Tailwind classes only.
- If a token you need does not exist, add it once to the theme with a semantic name and use it everywhere. Never inline it.
- Do not restyle any existing landing-page component. The only permitted edit to existing files is promoting a hardcoded value into the shared theme — and only if you flag it first.
- Every new UI surface must be verifiably built from tokens: a reviewer grepping your new components for `#` should find nothing in a color position.

### 4.4 Phase 0 acceptance criteria
- [ ] `docs/REPO_AUDIT.md` exists and every field is filled from observed evidence, with no "probably" or "likely".
- [ ] `docs/DESIGN_TOKENS.md` exists with all eight token sections plus App Adaptation.
- [ ] The hero component's actual code is quoted in the token doc as the reference.
- [ ] Zero application code has been written.
- [ ] A short list of anything ambiguous, phrased as `BLOCKER:` items.

---

# 5. PHASE 1 — EXISTING SCRAPER AUDIT
### 🚦 GATE — no integration code in this phase

**Precondition:** the user will paste the scraper source into the chat. If it has not been provided, respond only with:
`BLOCKER: Scraper source not provided. Phase 1 cannot begin.`
Do not write a placeholder scraper. Do not infer what it probably does. Do not proceed to Phase 2.

### 5.1 Produce `docs/SCRAPER_AUDIT.md`

**A. How it works**
Narrate the actual control flow end to end, referencing real function names from the source. Include a call graph if there is more than one module.

**B. Runtime and dependencies**
- Language and minimum runtime version.
- Every direct dependency with its purpose and installed version.
- Any system-level dependency (`lxml`, `libxml2`, a headless binary, a compiled extension).
- Any dependency that performs network I/O — **flag prominently**, since network access from the parser violates §2.1.

**C. Input contract**
- Exactly what it accepts: file path, directory path, string, stream, glob.
- Whether it reads a directory or takes explicit paths.
- Encoding assumptions and behavior on non-UTF-8 input.
- Assumptions about the HTML's shape (which Sales Navigator layout/version it targets).
- Behavior on: empty file, non-HTML file, valid HTML that isn't a results page, results page with zero results.

**D. Output contract**
- The exact output shape — dict/object keys, DataFrame columns, CSV headers — with types.
- Return value vs side effect: does it return data, write a file, or print?
- Whether output ordering is deterministic.

**E. Extracted fields — the canonical list**
A table with one row per field: `field name | data type | HTML source (selector/attribute) | always present? | example value (redacted) | notes`.

> **This table is the single source of truth for the `extracted_leads` schema in Phase 3.** Do not add columns the scraper cannot populate. Do not silently drop columns it does populate. If a field in the user's original wish-list (industry, company_size, description, etc.) is not in this table, record it in a `docs/UNSUPPORTED_FIELDS.md` list instead of inventing it.

**F. Execution model**
- Synchronous or asynchronous; blocking or streaming.
- Single-file or batch; whether batch state leaks between files.
- Presence of module-level mutable state, globals, or caches — **critical**, since these break multi-tenant safety.
- Hardcoded paths, `cwd` dependence, writes to fixed locations.
- Approximate memory profile per file and whether it loads the whole document into memory.
- Whether two instances can run concurrently in one process without interference.

**G. Defects**
Concrete bugs with the line or function that causes them. Distinguish: crashes, silent data loss, incorrect extraction, encoding issues, off-by-one/pagination errors.

**H. Security concerns**
Specifically check for and report on: `eval`/`exec`, `pickle` deserialization, `subprocess`/`os.system` calls, `open()` on user-controlled paths, XXE-capable XML parsing, unbounded recursion on nested HTML, regex susceptible to catastrophic backtracking, any outbound network call, and whether it writes anything outside its intended output directory.

**I. Performance limits**
Rough throughput per file, memory ceiling, and where it degrades non-linearly.

**J. Recommended integration method**
Choose one and justify against the source you read:
1. **Import as a library in the Node worker** — only if it is TypeScript/JavaScript and side-effect-free.
2. **Port to TypeScript** — only if it is trivially small (<150 lines), has no non-JS dependency, and the port is provably equivalent. Requires a golden-file test proving identical output on the same fixture.
3. **Run as a separate Python (or other-language) worker service** — the default when the scraper is not JavaScript.
4. **Invoke as a subprocess from a controlled wrapper** — only if 1–3 are impossible. Requires the wrapper contract in §11.4.

**K. Change plan**
- `MUST MODIFY` — file, what change, why it is unavoidable.
- `MUST NOT MODIFY` — files whose logic is correct and stays frozen.
- `WRAP, DON'T EDIT` — behavior to adjust from the outside via an adapter rather than by editing the scraper.

### 5.2 Phase 1 acceptance criteria
- [ ] Every section A–K is filled from the actual source, with line references.
- [ ] The extracted-fields table is complete and is explicitly labeled as the schema source of truth.
- [ ] Every field from the user's wish-list is either in the table or in `docs/UNSUPPORTED_FIELDS.md`.
- [ ] Zero lines of the scraper have been changed.
- [ ] Zero integration code written.

---

# 6. PHASE 2 — ARCHITECTURE DECISION RECORD
### 🚦 GATE — no application code in this phase

Produce `docs/ARCHITECTURE.md`.

### 6.1 The central decision: where extraction runs

The requirements are in tension and must be resolved explicitly:
- Next.js on Vercel → serverless functions with a hard execution ceiling (~60s Hobby, up to 300s Pro).
- Jobs must survive the user closing the browser.
- A 25-file batch may exceed any serverless ceiling.
- The scraper may not even be JavaScript.

**Resolution — build to this unless Phase 1 contradicts it:**

```
Browser ──upload──> Next.js Route Handler ──> Supabase Storage (private bucket)
                            │
                            └──> Postgres: extraction_jobs + uploaded_files + job_queue row
                                                    │
                                        (long-poll / LISTEN-NOTIFY)
                                                    ▼
                          Dedicated long-running worker process (own container)
                                                    │
                            claims job ─> downloads files ─> runs scraper ─>
                            normalizes ─> dedupes ─> writes leads ─> updates progress ─>
                            builds export ─> deletes temp files
```

- **Next.js app** (Vercel): all UI, auth, uploads, reads, exports-on-demand, admin. Never runs the scraper.
- **Worker**: a separate always-on process in its own container, deployed to Railway / Fly.io / Render. Language matches the scraper. Never exposed to the public internet — no inbound HTTP except an internal `/healthz`.
- **Queue**: a Postgres table in the same Supabase database, claimed with `SELECT ... FOR UPDATE SKIP LOCKED`. Chosen because it is transactional with the application data, adds no vendor, is inspectable with plain SQL, and works identically from Node or Python.

Record the rejected alternatives and why: in-process on Vercel (execution ceiling), Vercel background functions (ceiling still applies, and no non-JS runtime), Inngest/Trigger.dev (viable; adds a vendor and a JS-centric model — note as the fallback if self-hosting the worker is unacceptable), Redis/BullMQ (extra infra for no gain at this scale), Supabase Edge Functions (Deno-only, too restrictive for a Python scraper).

**If Phase 1 concluded the scraper is small, pure TypeScript**, you may propose collapsing the worker into a Node process that imports it directly — but the worker still runs as a separate long-lived container. Do not put extraction inside a request handler under any circumstance.

### 6.2 Also specify in `ARCHITECTURE.md`
- Component diagram and trust boundaries (which components hold the service-role key: worker and server-only Next.js code; nothing else).
- Full request lifecycle for: sign-up → access request → approval → upload → job → results → export.
- Failure modes and recovery: worker crash mid-job, storage unavailable, DB connection loss, poison-pill file, duplicate job submission, orphaned storage objects.
- Idempotency strategy: job claiming, per-file processing, and lead insertion must all be safe to retry.
- Data retention and deletion flow, including what happens to storage objects when a user deletes a job.
- Observability: what is logged, where, and the correlation ID scheme.
- Environments: local, staging, production — and how the worker is run locally.

### 6.3 Phase 2 acceptance criteria
- [ ] The extraction-location decision is stated unambiguously with rejected alternatives.
- [ ] The decision is consistent with Phase 1's findings about the scraper's language.
- [ ] `docs/FILE_TREE.md` shows the planned structure (see Appendix A) with each directory's responsibility in one line.
- [ ] Every subsequent phase can be started without further architectural questions.

---

# 7. PHASE 3 — DATABASE SCHEMA, MIGRATIONS, AND RLS

### 7.1 Rules
- Supabase migrations in `supabase/migrations/`, named `NNNN_description.sql`, sequential, forward-only. Each is idempotent (`if not exists` / `create or replace`) and reversible in intent.
- Every table has `id uuid primary key default gen_random_uuid()`, `created_at timestamptz not null default now()`, and where mutable, `updated_at timestamptz not null default now()` maintained by a trigger.
- Every user-owned table has `user_id uuid not null references auth.users(id) on delete cascade`.
- **RLS enabled on every table, with no exceptions.** A table with RLS enabled and no policy denies all access to non-service-role clients — that is the correct default for tables only the worker touches.
- Enums as Postgres enum types, not free-text check constraints, so the app and DB cannot drift.
- Index every foreign key and every column used in a `WHERE` or `ORDER BY` on a list screen.

### 7.2 Tables

Build exactly the tables listed in the user's original brief, with these corrections and additions:

**`profiles`** — `id` is both PK and FK to `auth.users(id)`. Add `role` (enum, see §8.1), `access_expires_at timestamptz`, `plan_id`, and `deleted_at`. Populated by an `on auth.users insert` trigger. **`role` must not be updatable by the user** — enforce with a policy that permits updating only `full_name` and `company_name`, or with a `before update` trigger that reverts privileged column changes.

**`access_requests`** — as specified. `request_type` enum: `payment | sales_call | manual_approval | trial | invitation`. `status` enum: `pending | approved | rejected | expired | suspended`. Add a partial unique index preventing more than one `pending` request per user.

**`extraction_jobs`** — as specified. `status` enum: `uploaded | queued | processing | completed | partially_completed | failed | cancelled`. Add `progress_step text`, `progress_current int`, `progress_total int`, `dedupe_mode`, and `export_storage_path`.

**`uploaded_files`** — as specified. Add `content_sha256 char(64) not null` and `deleted_at`. Unique index on `(user_id, content_sha256)` to prevent re-uploading identical content — surfaced to the user as a warning, not a hard error, since re-processing may be intentional.

**`extracted_leads`** — **columns come from Phase 1's field table, not from the wish-list.** Plus: `user_id`, `extraction_job_id`, `uploaded_file_id`, `source_page`, `dedupe_key text not null`, `dedupe_strategy`, `is_duplicate boolean not null default false`, `duplicate_of_id uuid references extracted_leads(id)`, `raw_data jsonb`. Index `(user_id, dedupe_key)`, `(user_id, extraction_job_id)`, and a GIN trigram index on the searchable text columns.

> `raw_data` holds only fields the scraper emitted that have no dedicated column. It must **never** contain the source HTML, cookies, tokens, or auth headers. Enforce this with a sanitizing allow-list in the worker, not a comment.

**`plans`** — `key` (`trial | starter | professional | agency | custom`), `name`, `is_active`, and a `limits jsonb` column. Seeded via migration with the placeholder values in §12.9. **No limit is hardcoded in application code.**

**`subscriptions`** (entitlements) — as specified, plus `plan_id references plans(id)` and `provider` (`manual | stripe | paddle | ...`).

**`usage_counters`** — not in the original brief but required for enforceable limits. `(user_id, period_start, period_end, metric, count)` with a unique index on `(user_id, metric, period_start)`. Metrics: `extractions`, `files`, `records`, `exports`, `storage_bytes`. Increments happen in the same transaction as the action they measure.

**`invitation_codes`** — `code` (unique, generated server-side, cryptographically random), `plan_id`, `max_uses`, `used_count`, `expires_at`, `created_by`, `is_active`.

**`job_queue`** — `job_id`, `status` (`pending | claimed | done | failed`), `claimed_at`, `claimed_by`, `attempts`, `max_attempts`, `next_attempt_at`, `last_error`. RLS enabled, **no policies** — service role only.

**`admin_audit_logs`** — as specified. Append-only: grant no `update` or `delete` to any role including service role, enforced by a trigger that raises on `UPDATE`/`DELETE`.

**`system_events`** — structured error/event log per §16 of the original brief.

### 7.3 RLS policy pattern
For every user-owned table:
```sql
alter table public.<t> enable row level security;

create policy "<t>_select_own" on public.<t>
  for select using (auth.uid() = user_id);
create policy "<t>_insert_own" on public.<t>
  for insert with check (auth.uid() = user_id);
create policy "<t>_update_own" on public.<t>
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "<t>_delete_own" on public.<t>
  for delete using (auth.uid() = user_id);
```

Admin access uses a `security definer` function reading `profiles.role`, never a client-supplied claim:
```sql
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
```

**Critical:** the service-role key bypasses RLS entirely. Every worker and admin query made with the service role must scope by `user_id` in application code. Write this warning at the top of the service-role client module.

### 7.4 Phase 3 acceptance criteria
- [ ] `supabase db reset` runs all migrations cleanly from empty.
- [ ] Every table reports `rowsecurity = true`.
- [ ] Generated TypeScript types are committed at `types/database.ts`.
- [ ] `extracted_leads` columns match Phase 1's field table exactly.
- [ ] A test proves user A cannot read user B's rows in any table via the anon client.
- [ ] A test proves a non-admin cannot escalate their own `profiles.role`.

---

# 8. PHASE 4 — AUTHENTICATION AND ACCESS CONTROL

### 8.1 Roles
Enum on `profiles.role`: `visitor` (unauthenticated, not stored) `| registered_user | pending_user | approved_user | subscriber | admin | suspended_user`.

### 8.2 Single source of truth for access
Implement exactly one server-side function:

```ts
// lib/auth/access.ts — server-only
export type AccessContext = {
  userId: string
  role: Role
  canUseScraper: boolean
  reason: 'ok' | 'unauthenticated' | 'no_request' | 'pending' | 'rejected'
        | 'expired' | 'suspended' | 'limit_reached' | 'payment_required'
  plan: Plan | null
  limits: PlanLimits
  usage: UsageSnapshot
  accessExpiresAt: string | null
}

export async function getAccessContext(): Promise<AccessContext>
export async function requireAccess(): Promise<AccessContext> // throws/redirects
export async function requireAdmin(): Promise<AccessContext>  // throws/redirects
```

Every protected page, Server Action, and Route Handler calls one of these. No route re-derives access logic. No client component decides access. Grep must show zero access decisions outside this module.

`canUseScraper` is true only when: role ∈ {`approved_user`, `subscriber`, `admin`}, **and** (`access_expires_at` is null or in the future), **and** the account is not suspended, **and** the relevant usage limit is not exceeded.

### 8.3 Auth implementation
- Supabase Auth via `@supabase/ssr` with cookie-based sessions. Three clients: browser, server (RSC/actions), and admin/service-role (server-only, never imported into anything client-reachable).
- Middleware refreshes the session and guards `/app/*` and `/admin/*` by authentication only. **Authorization happens in the route, not the middleware** — middleware is a convenience layer, not a security boundary.
- Flows: sign-up with email verification required, sign-in, password reset, sign-out, resend verification, session refresh.
- Password rules: minimum 12 characters, checked against a common-password deny-list. Do not impose composition rules that push users toward weaker passwords.
- Rate-limit auth endpoints: 5 attempts / 15 min per IP+email, exponential backoff, generic error messages that do not reveal whether an account exists.
- Optional but recommended: TOTP MFA for `admin` accounts.

### 8.4 Admin bootstrap
The first admin is granted by a seed migration reading `ADMIN_BOOTSTRAP_EMAIL`, or by a documented one-off SQL statement. There is **no self-service path to admin**, and no API route that can grant `admin`. Admin promotion is admin-only and always audit-logged.

### 8.5 Phase 4 acceptance criteria
- [ ] All six auth flows work end to end against local Supabase.
- [ ] A `registered_user` hitting any `/api/extract*` route receives 403 — verified by test, not by inspection.
- [ ] A direct `POST` to a protected route with a valid session but no access is rejected server-side.
- [ ] Suspended and expired accounts are blocked, with distinct `reason` values.
- [ ] `grep -r "role ===" app/ components/` returns no access decisions outside `lib/auth/`.

---

# 9. PHASE 5 — ACCESS REQUEST FLOW, ENTITLEMENTS, AND PAYMENT ABSTRACTION

### 9.1 Payment provider abstraction
Launch configuration is **manual approval only**, with payments abstracted for later. Define:

```ts
// lib/payments/provider.ts
export interface PaymentProvider {
  readonly key: string
  createCheckout(input: CreateCheckoutInput): Promise<{ url: string } | { manual: true }>
  handleWebhook(req: Request): Promise<WebhookResult>
  getCustomerPortalUrl(userId: string): Promise<string | null>
  cancelSubscription(ref: string): Promise<void>
}
```

Implement **`ManualProvider`** fully: `createCheckout` records an access request of type `payment` and returns `{ manual: true }`, which the UI renders as "our team will contact you with payment details." Implement `StripeProvider` as a file exporting a class whose methods throw `NotConfiguredError` with a clear message — a real, compiling placeholder, not a stub with fake logic. Selection is by `PAYMENT_PROVIDER` env var through a registry. Entitlement granting must be provider-agnostic: one `grantEntitlement()` function that every provider and the admin panel both call.

### 9.2 Access page — `/app/access`
Four options: purchase access, request a sales call, request manual approval, redeem an invitation code (shown only when invitations are enabled). Each submits an `access_requests` row and shows live status. Statuses render as distinct, plain-language states: pending review, approved, rejected, payment required, call requested, access expired.

### 9.3 Invitation codes
Server-side validation only. Constant-time comparison. Atomic redemption in a single transaction that increments `used_count` and grants the entitlement, so a code cannot be over-redeemed under concurrency. Rate-limit redemption attempts per user and per IP.

### 9.4 Phase 5 acceptance criteria
- [ ] A user can submit each request type and see accurate status.
- [ ] Manual approval grants access with no payment provider configured.
- [ ] Switching `PAYMENT_PROVIDER` requires no code change outside the registry.
- [ ] Concurrent redemption of a `max_uses = 1` code succeeds exactly once — proven by a test.

---

# 10. PHASE 6 — UPLOAD PIPELINE

### 10.1 Client
Drag-and-drop plus file picker, at `/app/extract/new`. Add files individually or in batches; per-file remove; names, sizes, and per-file upload progress; total-size indicator against the plan limit. Client validation is UX only — it is not trusted.

A consent checkbox is required before the upload button enables:
> *"I confirm I have the right to process the information contained in these files, and that I obtained them lawfully in accordance with applicable platform terms and privacy law."*

Helper text: *"Upload only `.html` files you saved manually from a lead search-results page. Do not upload files from any other source."*

### 10.2 Server validation — in this order, rejecting early
1. Authenticated, `canUseScraper === true`, plan file-count and file-size limits not exceeded.
2. File count ≤ `MAX_FILES_PER_JOB` and per-file size ≤ `MAX_UPLOAD_FILE_BYTES`, enforced by streaming byte count — never by trusting `Content-Length` or the client-reported size.
3. Extension is `.html`/`.htm` **and** declared MIME is `text/html` — treated as a hint only, never as proof.
4. **Content sniffing:** read the first 4KB. Reject if the leading bytes match a known binary signature (`PK\x03\x04`, `%PDF`, `\x7fELF`, `MZ`, `\x89PNG`, `GIF8`, `\xff\xd8\xff`, `\x1f\x8b`). Require that the decoded prefix contains one of `<!doctype html`, `<html`, or `<body` (case-insensitive). Reject files that are empty or whitespace-only.
5. Compute `sha256` over the full stream. If `(user_id, sha256)` already exists, mark it as a duplicate upload and warn — do not silently drop it.
6. Generate the storage key server-side. **Never** derive it from the user's filename:
   `{user_id}/{job_id}/{uuidv4}.html`
   The original filename is stored only as a database string for display, and is escaped on render. It never touches a filesystem path or a shell argument.

### 10.3 Storage
Private Supabase Storage bucket (`uploads`). No public read policy. Uploads go through a server-issued signed upload URL or a server route — the anon key never writes directly to another user's prefix. Storage RLS/policies restrict object paths to the owning `user_id` prefix.

### 10.4 Phase 6 acceptance criteria
- [ ] A `.exe` renamed to `.html` is rejected by content sniffing — proven by a fixture test.
- [ ] A 0-byte file and a valid-HTML-but-not-a-results-page file are both handled with distinct, friendly errors.
- [ ] A filename containing `../`, a null byte, or a shell metacharacter cannot influence the storage path — proven by test.
- [ ] Oversized uploads are rejected before the whole file is buffered in memory.
- [ ] Uploaded objects are unreachable without a signed URL — verified by an unauthenticated fetch test.

---

# 11. PHASE 7 — QUEUE, WORKER, AND SCRAPER INTEGRATION

### 11.1 Enqueue
Creating a job writes `extraction_jobs` + `uploaded_files` + `job_queue` in **one transaction**. Status starts at `uploaded`, becomes `queued` once all files are confirmed in storage.

### 11.2 Worker loop
```
loop:
  claim job (FOR UPDATE SKIP LOCKED, sets claimed_by + claimed_at)
  if none: sleep(JOB_POLL_INTERVAL_MS); continue
  set job.status = 'processing'
  for each file:
     download to an isolated temp dir (mkdtemp, 0700, unique per file)
     run scraper with a per-file timeout
     validate + normalize output
     on error: record file-level error, mark file 'failed', CONTINUE to the next file
     on success: mark file 'processed', accumulate rows
     update job progress after every file
     delete the temp dir in a finally block
  dedupe (Phase 8)
  bulk-insert leads in batches
  generate export artifact
  set final status: completed | partially_completed | failed
  mark queue row done; delete all temp files
```

**Requirements**
- One bad file never fails the batch. Final status is `partially_completed` when ≥1 file succeeded and ≥1 failed; `failed` only when zero files succeeded.
- Per-file timeout (`EXTRACTION_TIMEOUT_MS`) and a whole-job timeout. Timeouts kill the child process, not just the promise.
- Concurrency capped by `WORKER_CONCURRENCY`. Memory ceiling enforced per child process.
- Stale-claim reaper: jobs `processing` with `claimed_at` older than the job timeout are returned to `pending` and `attempts` incremented. Past `max_attempts`, they move to `failed` with a dead-letter reason.
- Retries use exponential backoff via `next_attempt_at`. Retries are idempotent — re-running a job must not duplicate leads (delete-then-insert scoped to `extraction_job_id`, inside a transaction).
- Graceful shutdown on `SIGTERM`: stop claiming, finish the current job or release its claim, then exit.
- Every temp directory is removed in a `finally`. A startup sweep clears orphans from a previous crash.

### 11.3 Progress reporting
Persist `progress_step` and `progress_current`/`progress_total` so the UI is accurate after a browser refresh. Steps, verbatim: `Uploading files` → `Waiting in queue` → `Processing file {n} of {total}` → `Cleaning data` → `Removing duplicates` → `Generating export` → `Completed` / `Completed with errors` / `Failed`. The UI polls the job row (or subscribes via Supabase Realtime); it never holds an open request for the duration of the job.

### 11.4 Subprocess wrapper contract
If Phase 1 chose subprocess invocation, the wrapper must:
- Use `spawn` with an **argument array** — never a shell string, never `shell: true`, never string interpolation.
- Pass a fixed argument shape: `[SCRAPER_ENTRYPOINT, '--input', <absolute temp path>, '--output', <absolute temp path>, '--format', 'json']`. No user-derived value is ever an argument.
- Set `cwd` to the isolated temp dir, pass a minimal explicit `env` (no inherited secrets), and set `timeout` + `killSignal`.
- Cap `stdout`/`stderr` buffers; treat scraper output as untrusted and validate it against a schema (Zod or equivalent) before it reaches the database.
- Run as a non-root user in the container, with a read-only root filesystem except the temp dir.

### 11.5 Normalization
A single `normalizeLead()` function: trim and collapse whitespace, strip zero-width and control characters, normalize Unicode to NFC, empty string → `NULL`, canonicalize URLs (§12.2), enforce max lengths, and drop any key not in the Phase-1 allow-list. It emits a validated object; invalid rows are counted and reported, never silently discarded.

### 11.6 Phase 7 acceptance criteria
- [ ] A 10-file job where file 4 is corrupt completes as `partially_completed` with 9 leads sets and one recorded file error.
- [ ] Killing the worker mid-job and restarting it recovers the job without duplicating leads.
- [ ] Closing the browser does not affect job completion.
- [ ] No temp files remain after a run, including after a forced crash.
- [ ] A filename containing `; rm -rf /` provably cannot reach a shell.
- [ ] Two jobs from two users process concurrently with no cross-contamination of results.

---

# 12. PHASE 8–11 — DEDUPE, DASHBOARD, TABLE, EXPORTS

### 12.1 Duplicate detection
Deterministic key resolution, in priority order. The first strategy that yields a value wins, and the strategy used is recorded in `dedupe_strategy`:

1. `linkedin_url_canonical` — canonicalized profile URL (§12.2).
2. `salesnav_id` — the Sales Navigator lead identifier, if the scraper extracts one.
3. `name_company` — `slug(full_name) + '|' + slug(company_name)`.
4. `name_title_company` — as above plus `slug(job_title)`.
5. `row_hash` — sha256 of all non-null normalized fields (guarantees a key always exists; only exact duplicates collide).

`slug()` = lowercase → NFKD → strip diacritics → strip everything but `[a-z0-9]` → collapse.

### 12.2 URL canonicalization
Lowercase host; drop protocol, `www.`, all query parameters, and the fragment; strip trailing slash; strip locale path prefixes (`/en/`, `/de/`, …). For `/in/{slug}` produce `li:in:{slug}`. For `/sales/lead/{id},{token}` produce `li:lead:{id}` (discard the volatile token — it changes between sessions and would defeat deduplication). Anything else → `li:raw:{normalized path}`.

### 12.3 Modes and reporting
User-selectable per job and re-runnable on the lead database: `keep_all` | `remove_exact` (strategies 1–2, or 5) | `remove_likely` (adds 3–4) | `review` (flag `is_duplicate = true`, delete nothing, present a review screen).

**Never delete silently.** Every job reports: total parsed, unique kept, duplicates found, duplicates removed, strategy breakdown. Duplicates are soft-marked with `duplicate_of_id` before any hard delete, and hard delete is always an explicit user action.

### 12.4 Dashboard — `/app`
Sections: Overview, New Extraction, Extraction History, Lead Database, Exports, Account & Billing, Support, Access Status. Overview cards: total jobs, total files, total leads, duplicates removed, remaining usage this period (with the period reset date), recent jobs, current access status with expiry.

Every screen needs designed **loading**, **empty**, and **error** states. Empty states explain the next action, not just "no data."

### 12.5 Lead table — `/app/leads`
Server-side pagination, sorting, and filtering — never fetch the full set to the client. Debounced search over indexed columns. Column visibility (persisted per user), row selection with select-all-matching-filter, bulk delete with confirmation, export selected / filtered / all, duplicate and missing-data indicators, source job and filename references, and profile links rendered as `rel="noopener noreferrer nofollow"` external links. Missing values render as a muted `—`, never as `null`, `undefined`, or an empty cell.

### 12.6 Exports — CSV and XLSX
Column selection, custom filename (sanitized server-side to `[A-Za-z0-9._-]`), include/exclude duplicates, scope = all / selected / filtered. Large exports are generated by the worker and delivered as a signed URL; small exports may stream from a route handler. Exports are recorded and counted against the plan's export limit.

**Formula-injection defense — implement once, use in BOTH writers:**

```ts
// lib/export/sanitize.ts
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const RISKY_PREFIX  = /^[=+\-@\t\r]/

export function sanitizeCell(value: unknown): string | number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  let v = String(value).replace(CONTROL_CHARS, '')
  if (RISKY_PREFIX.test(v)) v = "'" + v  // leading apostrophe forces text interpretation
  return v
}
```

The leading-apostrophe approach preserves the original characters, unlike stripping them, at the cost of a visible apostrophe in the rare affected cell. Note this in the export help text. Both the CSV writer and the XLSX writer must call this single function. CSV is written with `\r\n`, RFC 4180 quoting, and a UTF-8 BOM for Excel compatibility. Never build CSV by string concatenation. Test it: a lead whose `full_name` is `=cmd|'/c calc'!A1` must be inert when the file is opened.

### 12.7 Signed URLs
TTL from `SIGNED_URL_TTL_SECONDS`, default 60. Generated only after re-verifying the requester owns the resource. Never logged, never embedded in HTML sent to another user, never cached in a shared layer.

### 12.8 Admin dashboard — `/admin`
Every capability from the original brief. `requireAdmin()` on every route and Server Action, including read-only ones. **Every state-changing admin action writes an `admin_audit_logs` row in the same transaction as the change** — if the log write fails, the action rolls back. Audit logs are visible in the UI and cannot be edited or deleted by anyone.

### 12.9 Usage limits
All limits come from `plans.limits` (JSONB) at runtime. Metrics: `files_per_extraction`, `extractions_per_day`, `extractions_per_month`, `records_per_extraction`, `records_per_month`, `storage_bytes`, `exports_per_month`, `retention_days`. Enforced server-side at the moment of action, inside the same transaction that records usage, so concurrent requests cannot both slip under a limit. Placeholder seed values:

| plan | files/extraction | extractions/mo | records/mo | storage | retention | exports/mo |
|---|---|---|---|---|---|---|
| trial | 5 | 3 | 500 | 100 MB | 7 d | 5 |
| starter | 25 | 30 | 10,000 | 1 GB | 90 d | 50 |
| professional | 100 | 150 | 75,000 | 10 GB | 365 d | 500 |
| agency | 250 | 500 | 300,000 | 50 GB | 730 d | unlimited |
| custom | configurable | configurable | configurable | configurable | configurable | configurable |

Mark these clearly as `PLACEHOLDER — pending final pricing` in the seed migration.

---

# 13. PHASE 12–14 — SECURITY, COMPLIANCE, TESTS, DEPLOYMENT

### 13.1 Security hardening pass
Produce `docs/SECURITY.md` mapping each threat below to the specific file and line that mitigates it. A threat with no named mitigation is an open finding, not a checkbox.

XSS (stored and reflected) · path traversal · malicious filenames · oversized uploads · billion-laughs / deeply nested HTML · parser DoS and ReDoS · CSV/XLSX formula injection · IDOR / broken object-level authorization · API abuse and rate limiting · credential stuffing and brute force · privilege escalation to admin · storage URL leakage · stack-trace exposure · SQL injection · command injection · vulnerable scraper dependencies · SSRF via any URL the scraper might follow.

Also: security headers via `next.config` (CSP without `unsafe-eval`, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`), CSRF protection on all mutations, rate limiting on auth / upload / export / admin routes, and `npm audit` / `pip-audit` in CI.

### 13.2 Error handling and logging
A typed error catalog with stable codes. Users see the friendly message; logs get the detail. **Never** return a stack trace, SQL string, storage path, or internal identifier to the client.

| code | user-facing message |
|---|---|
| `ERR_FILE_TYPE` | "That file type isn't supported. Upload `.html` files saved from a lead search-results page." |
| `ERR_FILE_EMPTY` | "This file appears to be empty." |
| `ERR_FILE_FORMAT` | "We couldn't recognize this as a lead search-results page. Make sure you saved the full page." |
| `ERR_NO_LEADS` | "No leads were found in this file." |
| `ERR_PARTIAL` | "Some files couldn't be processed. Your results include everything we could read." |
| `ERR_TIMEOUT` | "This file took too long to process. Try uploading fewer files at once." |
| `ERR_WORKER_DOWN` | "Processing is temporarily unavailable. Your job is queued and will run automatically." |
| `ERR_EXPORT` | "We couldn't build your export. Please try again." |
| `ERR_STORAGE` | "We couldn't save your file. Please try again." |
| `ERR_ACCESS_EXPIRED` | "Your access has expired. Renew to continue." |
| `ERR_LIMIT_REACHED` | "You've reached your plan limit for this period." |

Structured JSON logs with `request_id`, `job_id`, `user_id`, `file_id`, `step`, `error_code`, `duration_ms`. **Never log** full lead records, file contents, access tokens, signed URLs, session cookies, or email bodies. Add a log redaction helper and use it everywhere.

### 13.3 Compliance screens
`/terms`, `/privacy`, `/acceptable-use`, `/data-processing`, plus in-app data export and account deletion (deleting storage objects, DB rows, and exports). The upload consent checkbox from §10.1 is required, and the acceptance is recorded with a timestamp.

Display, in plain language: the user is responsible for having the right to process uploaded information; the app processes only user-submitted files; the app does not require or store platform login credentials; the app does not browse any platform automatically; the user must comply with applicable platform terms, privacy law, and local law. Write these as clear product copy — **not** as legal advice, and add a visible note that the documents require review by qualified counsel before launch.

> **Flag to the business owner, not for you to resolve:** processing data copied from a platform may be restricted by that platform's user agreement regardless of how the file was obtained, and lead data about identifiable people is personal data under GDPR/UK GDPR and similar regimes — which brings lawful-basis, notice, and data-subject-rights obligations. Surface this in `docs/PROGRESS.md` as a business/legal decision; do not attempt to answer it in code or copy.

### 13.4 Tests
Framework: Vitest + Testing Library; Playwright for the critical E2E path. Local Supabase for integration tests.

Required coverage: auth flows · access control per role · admin authorization on every admin route · upload validation including hostile fixtures · scraper input handling · output normalization · duplicate detection per strategy · job state transitions · partial-failure handling · CSV generation · XLSX generation · formula-injection prevention · usage-limit enforcement including concurrent requests · RLS policies · cross-user data isolation · file deletion including storage cleanup · expired access · suspended accounts.

**Fixtures** live in `tests/fixtures/html/` and must contain only fabricated data — invented names, `example.com` domains, and `linkedin.com/in/fabricated-slug-N` URLs. **Never commit a real saved page or any real person's data.** Include hostile fixtures: empty file, binary renamed to `.html`, 50MB of nested `<div>`s, HTML with an inline `<script>`, a page with zero results, and a lead whose name is `=cmd|'/c calc'!A1`.

Also add a **golden-file test** locking the scraper's output on a known fixture, so any future change to extraction logic is caught immediately.

### 13.5 Deployment
Produce `docs/DEPLOYMENT.md` covering: Next.js app on Vercel (landing page and `/app` share the domain — the app is at `outlio.io/app`, admin at `outlio.io/admin`); worker as a Docker container on Railway/Fly.io/Render with a documented `Dockerfile`, resource limits, and health check; Supabase project setup, migration deployment, and storage bucket configuration with policies; environment variables per environment (Appendix B); queue operation and monitoring; log aggregation and error monitoring (Sentry DSN placeholder); database backup and restore procedure; and rollback steps.

Also produce a `README.md` with local setup: prerequisites, `supabase start`, migration run, seed, env setup, running the app and worker locally, running tests, and how to load test fixtures.

---

# APPENDIX A — TARGET FILE TREE

Adjust to match the existing repo's conventions discovered in Phase 0. This is the shape, not a mandate to relocate existing files.

```
app/
  (marketing)/              # EXISTING — do not modify
  (auth)/sign-in | sign-up | reset-password | verify-email
  app/                      # authenticated product
    layout.tsx              # calls requireAccess-aware shell
    page.tsx                # overview
    access/                 # request access + status
    extract/new/            # upload interface
    jobs/ | jobs/[id]/      # history + live progress
    leads/                  # lead database table
    exports/
    account/
    support/
  admin/                    # requireAdmin() on every route
    users/ | requests/ | jobs/ | invitations/ | audit/ | system/
  api/
    upload/ | jobs/ | export/ | webhooks/[provider]/ | admin/
components/
  ui/                       # shadcn primitives (existing)
  app/                      # dashboard components
  upload/ | leads/ | jobs/ | admin/
lib/
  supabase/{client,server,admin}.ts
  auth/access.ts            # SINGLE source of access truth
  payments/{provider,manual,stripe,registry}.ts
  queue/{enqueue,claim}.ts
  leads/{normalize,dedupe,canonical-url}.ts
  export/{csv,xlsx,sanitize}.ts
  limits/{plans,usage}.ts
  logging/{logger,redact}.ts
  errors/{catalog,handler}.ts
  validation/{upload,scraper-output}.ts
worker/                     # separate deployable
  Dockerfile
  src/{index,claim,process,scraper-adapter,progress}.*
supabase/
  migrations/ | seed.sql | config.toml
tests/
  unit/ | integration/ | e2e/ | fixtures/html/
docs/
  REPO_AUDIT.md | DESIGN_TOKENS.md | SCRAPER_AUDIT.md | UNSUPPORTED_FIELDS.md
  ARCHITECTURE.md | FILE_TREE.md | SECURITY.md | DEPLOYMENT.md | PROGRESS.md
.env.example
CLAUDE.md
```

---

# APPENDIX B — `.env.example`

Placeholder names only. Never commit real values.

```bash
# --- App ---
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=
NODE_ENV=

# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # SERVER + WORKER ONLY. Never NEXT_PUBLIC_. Bypasses RLS.
SUPABASE_STORAGE_BUCKET=uploads
DATABASE_URL=
DIRECT_URL=

# --- Uploads ---
MAX_UPLOAD_FILE_BYTES=10485760
MAX_FILES_PER_JOB=100
ALLOWED_UPLOAD_EXTENSIONS=.html,.htm
SIGNED_URL_TTL_SECONDS=60

# --- Worker / queue ---
WORKER_CONCURRENCY=2
JOB_POLL_INTERVAL_MS=2000
EXTRACTION_TIMEOUT_MS=60000
JOB_TIMEOUT_MS=1800000
JOB_MAX_ATTEMPTS=3
WORKER_TEMP_DIR=/tmp/outlio
SCRAPER_MODE=                     # library | subprocess | service  (set from Phase 1)
SCRAPER_ENTRYPOINT=

# --- Payments ---
PAYMENT_PROVIDER=manual           # manual | stripe | paddle
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=

# --- Access ---
ADMIN_BOOTSTRAP_EMAIL=
INVITATIONS_ENABLED=false

# --- Rate limiting ---
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# --- Email ---
RESEND_API_KEY=
EMAIL_FROM=

# --- Observability ---
SENTRY_DSN=
LOG_LEVEL=info

# --- Retention ---
DEFAULT_RETENTION_DAYS=90
```

---

# APPENDIX C — RESPONSE FORMAT

**For Phases 0–2 (gates):** produce the specified document, then a short summary containing your understanding of the scraper, the risks you found, your recommended architecture, the proposed user journey, the proposed admin journey, the schema, the API and worker design, the required project changes, the implementation sequence, and any genuine blockers. Then stop.

**For every implementation phase:**
1. **Files** — a table of created/modified files, one line each on purpose.
2. **Code** — complete and working. No placeholders except where this document explicitly permits them.
3. **Placement** — where each file belongs and why, if not obvious.
4. **Verification** — the commands you ran and their results. If you could not run something, say so plainly rather than claiming success.
5. **Deviations** — anything you did differently from this spec, and why.
6. **Next** — what the following phase needs to know.
7. **Blockers** — `BLOCKER:` items, if any.

Then stop and wait.

---

# APPENDIX D — LEGITIMATE PLACEHOLDERS

Use placeholders **only** for: final plan pricing and limits, logo and brand assets beyond the extracted tokens, payment-provider credentials, production domain names, support email and helpdesk URL, sales-call booking link, company legal entity details in the policy documents, and the Sentry DSN.

Everything else must be really implemented.
