# Planned File Tree — Phase 2

Adapted to this repo's actual conventions (App Router, npm, `@/*` → repo root,
non-route folders already living inside `app/`).

**Existing files are marked `EXISTING`. Everything else is planned.**

---

```
app/
  layout.tsx                    EXISTING — root layout, metadata, JSON-LD
  page.tsx                      EXISTING — landing page (READ-ONLY)
  globals.css                   EXISTING — design tokens (additions only)
  robots.ts  sitemap.ts         EXISTING
  explainers/  privacy/  terms/ EXISTING
  components/                   EXISTING — 24 marketing components (READ-ONLY)
  lib/                          EXISTING — constants, useThrottledScroll

  (auth)/                       route group — unauthenticated, hero styling allowed
    sign-in/page.tsx
    sign-up/page.tsx
    verify-email/page.tsx
    reset-password/page.tsx

  (product)/                    route group — authenticated, flat backgrounds
    layout.tsx                  app shell; calls requireAccess()
    dashboard/
      page.tsx                  overview: usage, recent jobs, access status
      access/page.tsx           request access + live status
      extract/new/page.tsx      upload interface
      jobs/page.tsx             history
      jobs/[id]/page.tsx        live progress for one job
      leads/page.tsx            lead database table
      exports/page.tsx
      account/page.tsx
      support/page.tsx

  admin/                        requireAdmin() on EVERY route, incl. read-only
    page.tsx
    users/  requests/  jobs/  invitations/  audit/  system/

  api/
    upload/route.ts
    jobs/[id]/route.ts
    export/route.ts
    webhooks/[provider]/route.ts
    admin/…

components/
  ui/                           shadcn primitives — NOT YET INSTALLED
  product/                      dashboard shell, nav, page header, empty/error states
  upload/  leads/  jobs/  admin/

lib/
  supabase/
    client.ts                   browser client
    server.ts                   RSC + Server Actions
    admin.ts                    SERVICE ROLE — server-only, bypasses RLS
  auth/
    access.ts                   SINGLE source of access truth
  leads/
    parse.ts                    cheerio parser — built from docs/SELECTOR_MAP.md §3
    normalize.ts                normalizeLead()
    dedupe.ts                   5 strategies, priority order
    canonical-url.ts            li:lead:{id} / li:company:{n}
  export/
    sanitize.ts                 sanitizeCell() — the ONLY formula-injection defense
    csv.ts  xlsx.ts             both MUST call sanitizeCell()
  queue/
    enqueue.ts  claim.ts
  limits/
    plans.ts  usage.ts          all limits read from plans.limits JSONB
  payments/
    provider.ts  manual.ts  stripe.ts  registry.ts
  logging/
    logger.ts  redact.ts
  errors/
    catalog.ts  handler.ts      typed codes; friendly copy to users
  validation/
    upload.ts  parser-output.ts

worker/                         separate deployable, Node
  Dockerfile
  src/
    index.ts                    loop, graceful SIGTERM, startup orphan sweep
    claim.ts                    FOR UPDATE SKIP LOCKED
    process.ts                  per-file isolation, progress updates
    progress.ts

supabase/
  migrations/                   NNNN_description.sql — sequential, forward-only
  seed.sql
  config.toml

tests/
  unit/  integration/  e2e/
  fixtures/html/                FABRICATED DATA ONLY

types/
  database.ts                   generated from Supabase, committed

docs/                           EXISTING — all Phase 0-2 documents
middleware.ts                   session refresh + auth guard (NOT authorization)
.env.local                      EXISTING — gitignored
.env.example                    placeholder names only
```

---

## Directory responsibilities

| Path | Responsibility |
|---|---|
| `app/(auth)/` | Unauthenticated pages. The only product surface allowed the hero gradient/aurora treatment. |
| `app/(product)/` | Authenticated product at `outlio.io/dashboard`. Flat backgrounds, no entrance animations. |
| `app/admin/` | Admin surfaces. `requireAdmin()` on every route and Server Action without exception. |
| `app/api/` | Route handlers. Upload, job reads, exports, webhooks. **Never runs the parser.** |
| `components/ui/` | shadcn primitives. Install in CSS-variable mode against existing tokens. |
| `components/product/` | Shell, nav, headers, and the shared loading/empty/error states. |
| `lib/supabase/` | Exactly three clients. Never a fourth. |
| `lib/auth/` | The only place access is decided. A grep for access logic elsewhere is a bug. |
| `lib/leads/` | Parse, normalize, dedupe, canonicalize. Pure functions, no I/O. |
| `lib/export/` | CSV and XLSX writers. Both call the single `sanitizeCell()`. |
| `lib/limits/` | Plan limits and usage counters, read from the database at runtime. |
| `worker/` | The only component that runs extraction. Own container, no public inbound HTTP. |
| `supabase/migrations/` | Forward-only, idempotent SQL. RLS enabled on every table. |
| `tests/fixtures/html/` | Fabricated fixtures only. A real saved page here is a data-protection incident. |

---

## Deviations from spec Appendix A

| Spec | Here | Why |
|---|---|---|
| `app/app/` | `app/(product)/dashboard/` | `app/` is the App Router root; `app/app/` is confusing. User chose `outlio.io/dashboard`. |
| `components/ui/` "(existing)" | not installed | No `components.json` in this repo. Install during Phase 3. |
| `worker/src/scraper-adapter.*` | **omitted** | No external scraper to adapt. The parser is `lib/leads/parse.ts`, imported directly. |
| `lib/queue/`, `lib/leads/` etc. | unchanged | Matches spec. |
| `utils/supabase/` (Supabase scaffold) | `lib/supabase/` | Spec wins; keeps all shared code under one root. |

---

## Naming and placement rules

- Route segments are lowercase kebab-case. Clean, descriptive, no abbreviations.
- Route groups `(auth)` / `(product)` organise without appearing in the URL.
- Server Components by default. `'use client'` only where interactivity requires it.
- Anything importing `lib/supabase/admin.ts` must be unreachable from the client.
  If a client component can reach it, that is a **security defect**, not a lint nit.
- No file is created that this tree does not list without stating why first.
