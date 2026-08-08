# Unsupported Fields

Fields that cannot be populated from a saved Sales Navigator search-results page.

**Rule:** nothing here gets a column in `extracted_leads`, a UI element, or an
export header. Spec §2.2 rule 7 — never fabricate, infer, enrich, or LLM-fill.

---

## 1. Removed by LinkedIn — previously captured

The old scraper extracted these. The DOM nodes no longer exist.
Confirmed against a real saved page, 2026-08-05.

| Field | Old selector | Occurrences today | Decision |
|---|---|---|---|
| `Notes` | `div.list-entity-notes__preview-text` → `span[style*="display: inline"]` | **0** | **Dropped** — user confirmed not commercially important, 2026-08-06 |
| `Date Entered` | `td[class*=date-added]` | **0** | **Dropped** — same |

These were tied to the old table layout. Nothing equivalent appears anywhere in
the current markup.

---

## 2. Present on the page but NOT per-lead

These `data-anonymize` markers exist, but only **once per page** — they belong to
the sidebar card describing the *filtered* company, not to individual leads.

| Marker | Occurrences | Why excluded |
|---|---|---|
| `industry` | 1 | Describes one company; 25 leads span 26 companies |
| `company-size` | 1 | Same |
| `company-blurb` | 1 | Same |

**Mapping any of these onto lead rows would fabricate data for 24 of 25 leads.**
They are excluded deliberately, not by oversight.

If per-lead industry or company size becomes a requirement, it needs a different
source — not this page.

---

## 3. Never available from this source

Common lead-gen wish-list fields with no representation in a saved search-results
page at all:

| Field | Why unavailable |
|---|---|
| Email address | Never rendered in search results |
| Phone number | Never rendered |
| Company website | Not present; only the internal `/sales/company/{id}` link |
| Company revenue / headcount | Not per-lead (see §2) |
| Seniority / function | Not exposed as data attributes |
| Years of experience (total) | Only per-role and per-company tenure exist |
| Connection degree | Not rendered in the saved DOM |
| Profile photo URL | `img[data-anonymize=headshot-photo]` exists, but `src` is a short-lived signed CDN URL that expires — storing it yields dead links |
| Skills, education, full work history | Live on the profile page, not the results page |

Obtaining any of these would require visiting profile pages — **prohibited** by
`CLAUDE.md` rule 1 and spec §2.1. Not a technical limitation to route around; a
product boundary.

---

## 4. What IS available

For contrast, the ten validated fields are in `docs/SELECTOR_MAP.md` §3.

Net position versus the old tool: **lost 2** (`Notes`, `Date Entered`),
**gained 3** (`person_blurb`, `tenure_in_role`, `tenure_in_company`), plus
`linkedin_url` and `company_url` promoted from formula fragments to real columns.

---

## 5. If a field here becomes required

1. Do **not** add a column and leave it null
2. Do **not** infer it from another field
3. Record the business need, then evaluate a lawful separate source
4. Any enrichment provider is a new architectural decision, a new data-processing
   disclosure, and a GDPR question — not a parser change
