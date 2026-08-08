# Repository Audit — Phase 0

Every field below was read from the repository on 2026-08-05. Nothing is inferred.

---

## 1. Framework and runtime

| Item | Value | Evidence |
|---|---|---|
| Next.js | **16.2.10** | `package.json` dependencies |
| Router | **App Router** | `app/layout.tsx` + `app/page.tsx` exist; no `pages/` directory |
| React | **19.2.4** | `package.json` |
| TypeScript | **^5** | `package.json` devDependencies |
| Package manager | **npm** | `package-lock.json` present; no `pnpm-lock.yaml`, no `yarn.lock` |
| Node version | **not pinned** | no `.nvmrc`, no `engines` field, no CI config |

> **Correction to the spec.** `CLAUDE.md` and `IMPLEMENTATION_PROMPT.md` both assume
> `pnpm`. This repo uses **npm**. All commands are `npm run …`. Do not introduce a
> second package manager.

### TypeScript configuration (`tsconfig.json`)

- `strict: true`
- `noEmit: true`, `incremental: true`, `isolatedModules: true`
- `target: ES2017`, `module: esnext`, `moduleResolution: bundler`
- `jsx: react-jsx`
- **Path alias:** `@/*` → `./*` (repo root, not `src/`)

Absent and worth adding for the app: `noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`. Both are Phase 3+ decisions, not Phase 0 changes.

---

## 2. Styling

| Item | Value |
|---|---|
| Tailwind | **v4** (`tailwindcss: ^4`, `@tailwindcss/postcss`) |
| Config style | **CSS-based** — `@import "tailwindcss"` + `@theme inline` in `app/globals.css` |
| `tailwind.config.*` | **does not exist** — correct for v4, do not create one |
| PostCSS | `postcss.config.mjs`, single plugin `@tailwindcss/postcss` |
| shadcn/ui | **not installed** — no `components.json`, no `components/ui/` |

> **Correction to the spec.** Appendix A assumes `components/ui/` shadcn primitives
> "(existing)". They do not exist. Either install shadcn in Phase 3 or hand-build
> primitives from the tokens. Recommendation: install shadcn configured for
> CSS-variable mode against the existing tokens, so the app gets accessible
> primitives without re-deriving focus/disabled states.

---

## 3. Existing infrastructure

| Concern | State |
|---|---|
| Authentication | **none** |
| Supabase | **none** — no client, no migrations, no `supabase/` directory |
| Database | **none** |
| Environment files | **none** — no `.env`, no `.env.example` |
| Payment provider | **none** |
| Rate limiting | **none** |
| Error monitoring | **none** |

Everything the SaaS needs on the backend is greenfield.

---

## 4. Tooling

| Tool | State |
|---|---|
| ESLint | **v9 flat config** (`eslint.config.mjs`, `eslint-config-next`) |
| `npm run lint` | exists (`eslint`) |
| `npm run typecheck` | **MISSING** |
| Test runner | **MISSING** — no Vitest, no Jest, no Playwright |
| Prettier | **MISSING** |
| CI | **MISSING** — no `.github/workflows` |

> **Blocks the spec's definition-of-done (§3.4)**, which requires `typecheck`,
> `lint`, and `test` to pass. Two of the three cannot currently be run.
> Adding `"typecheck": "tsc --noEmit"` and installing Vitest is the first task of
> Phase 3.

### Scripts today

```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "eslint"
```

---

## 5. Deployment

| Signal | State |
|---|---|
| `vercel.json` | absent |
| `Dockerfile` | absent |
| GitHub Actions | absent |
| `.vercel` in `.gitignore` | present — indicates Vercel deployment |

`next.config.ts` sets: AVIF/WebP image formats, custom `deviceSizes`/`imageSizes`,
`compress: true`, `poweredByHeader: false`, a one-year immutable `Cache-Control`
on static image extensions, and an empty `redirects()` array.

**No security headers are configured.** Spec §13.1 requires CSP, HSTS,
`X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`. All must be
added in Phase 12. Adding a CSP will require auditing the existing landing page,
which uses inline `style={{…}}` extensively and one inline
`dangerouslySetInnerHTML` JSON-LD script in `app/layout.tsx:166`.

---

## 6. Route map

| Route | File | Notes |
|---|---|---|
| `/` | `app/page.tsx` | 858 lines, `"use client"` |
| `/explainers` | `app/explainers/page.tsx` | |
| `/privacy` | `app/privacy/page.tsx` | exists — spec §13.3 satisfied in part |
| `/terms` | `app/terms/page.tsx` | exists — spec §13.3 satisfied in part |
| `/robots.txt` | `app/robots.ts` | generated route |
| `/sitemap.xml` | `app/sitemap.ts` | generated route |

Missing per spec §13.3: `/acceptable-use`, `/data-processing`.

### ⚠️ Route collision analysis

The spec repeatedly says the product lives "under `/app` routes". In the App
Router, **`app/` is the router root**, so the URL `outlio.io/app` maps to
**`app/app/page.tsx`**. That nesting is legal and unambiguous, but it reads badly
and will confuse every future contributor.

Also note this repo already places **non-route folders inside the router root**:
`app/components/` (24 files) and `app/lib/`. Next.js only treats a folder as a
route when it contains `page.tsx`/`route.ts`, so these do not create routes — but
it means `app/` is not a pure route tree.

**Recommendation — decide in Phase 2:** use a route group and put the product at
`app/(product)/dashboard/…` rather than `app/app/…`, or accept `app/app/`. No
existing route collides with `dashboard`, `admin`, `api`, `sign-in`, or `sign-up`.

---

## 7. Existing landing-page components

24 components in `app/components/`. Read-only per `CLAUDE.md` rule 6.

Relevant to the app build:

- `Nav.tsx`, `Footer.tsx` — shell; the app needs its own, not these
- `Breadcrumbs.tsx`, `FAQSchema.tsx` — SEO, already present
- `ErrorBoundary.tsx` — **reusable**, check before writing a new one
- `Reveal.tsx` — scroll animation; **must not** be used on app data screens
  (`CLAUDE.md` design rule: no entrance animations on upload/jobs/leads)
- Heavy canvas/animation: `StarFieldCanvas`, `Starfield`, `MeteorShower`,
  `CosmicHeroViz`, `OrbitalCaseStudies`, `InteractiveWorldMap` — marketing only

---

## 8. Findings requiring a decision

**`BLOCKER: placeholder verification codes are live in production metadata.**
`app/layout.tsx:70-73` ships literal placeholder strings:

```ts
verification: {
  google: 'your-google-verification-code',
  yandex: 'your-yandex-verification-code',
},
```

These emit real `<meta>` tags with junk values. Harmless to ranking but they
should be filled with the real Search Console token or removed. Outside the SaaS
scope — flagged because it is in the file we must not otherwise modify.

**`BLOCKER: no typecheck or test script exists.** The spec's per-phase gate cannot
be satisfied until these are added. Recommend adding both at the start of Phase 3.

**`BLOCKER: `/app` route naming.** See §6. Needs a decision before any route is
created.

---

## 9. Phase 0 acceptance

- [x] Next.js version and router recorded
- [x] TypeScript config, strictness, path aliases recorded
- [x] Package manager determined (**npm**, not pnpm)
- [x] Node version — recorded as **not pinned**
- [x] Tailwind version and config format (**v4, CSS-based**)
- [x] shadcn status (**not installed**)
- [x] Existing auth / Supabase (**none**)
- [x] Deployment evidence recorded
- [x] Route map and collision analysis complete
- [x] Lint/format/test tooling recorded
- [x] Zero application code written
- [x] Ambiguities listed as `BLOCKER:` items
