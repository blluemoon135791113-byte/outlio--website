# Scraper Audit — Phase 1

**Subject:** `NEW_LinkedIn_Lead_Scraper.exe` (37 MB RAR → 39 MB PE32+ executable)
**Audited:** 2026-08-05 / 2026-08-06
**Verdict:** **obsolete — do not integrate.** Rewrite required. See §J.

---

## Provenance note

The user no longer has the original source. The `.exe` is a PyInstaller bundle, so
the audit below was produced by:

1. Extracting the PyInstaller CArchive (1,660 entries) — file parsing only
2. Unmarshalling the `scraper_gui` code object with CPython 3.11
3. Disassembling the bytecode and reading instructions directly

**The binary was never executed.** It is a Windows PE and could not run on the
build machine regardless. Reconstructed source lives at
`Linkedin Sales Navigator Scraper SaaS/recovered/scraper_gui_recovered.py`.

Selectors, regexes, literals, output columns and branch structure are read from
compiled instructions and are exact. Formatting and comments are supplied.

---

## A. How it works

Single module `scraper_gui.py`, one class `LinkedInScraperGUI`, Tkinter desktop app.

```
main()                       → instantiate Tk root, mainloop
  __init__            (L11)  → StringVars: html_file_path, excel_file_name
  create_widgets      (L25)  → Tkinter layout, 700x500, non-resizable
  browse_html_file    (L150) → askopenfilename, filter *.html *.htm
  scrape_data         (L159) → THE ENTIRE PRODUCT — parse one file, return DataFrame
  save_to_excel       (L310) → xlsxwriter, header format, write_url, set_column
  copy_to_clipboard   (L400) → strips =HYPERLINK() via regex, TSV to clipboard
  log_message         (L143) → append to a disabled Text widget
```

`scrape_data` (L159–309, ~150 lines) is the only portable logic. Everything else
is desktop-GUI and spreadsheet-export concern that the SaaS replaces.

---

## B. Runtime and dependencies

| Item | Value |
|---|---|
| Language | Python **3.11** (`python311.dll`) |
| Platform | Windows x86-64 **only** (PE32+ GUI) |
| Packer | PyInstaller |

Bundled top-level packages: `pandas`, `numpy`, `lxml`, `bs4`, `openpyxl`,
`xlsxwriter`, `tkinter`/`tcl86t`/`tk86t`, `dateutil`, `pytz`.

### ✅ Network I/O: none

| Probed | TOC hits |
|---|---|
| `selenium`, `playwright`, `webdriver`, `chromedriver` | **0** |
| `requests`, `httpx`, `aiohttp`, `scrapy` | **0** |
| `certifi`, `urllib3` | **0** |

Zero `certifi`/`urllib3` is conclusive — `requests` cannot exist without them.
`_socket.pyd`, `_ssl.pyd`, `libssl-3.dll` are present, but PyInstaller ships those
with every CPython build whether or not they are imported.

**The tool never contacts LinkedIn.** Spec §2.1 is satisfied by the original
design, not retrofitted.

---

## C. Input contract

- Accepts **one** absolute file path, chosen through a Tk file dialog
- No directory mode, no glob, no batch, no stdin
- Opened `open(html_file, "r", encoding="utf-8")` — **hardcoded** (L175)
- Non-UTF-8 input raises `UnicodeDecodeError`, caught by the outer handler at
  L305, surfaced as a modal dialog. The whole run dies.
- Empty file → `find_all` returns `[]` → "No leads found in the HTML file!"
- Non-HTML file → BeautifulSoup parses it as junk → same "No leads" path
- Targets a **table-based Sales Navigator layout that no longer exists** (§G)

---

## D. Output contract

- Returns a `pandas.DataFrame`; `None` on any failure
- Side effects: Tk modal dialogs and appended log lines
- Ordering is deterministic — document order of matched rows
- `save_to_excel` writes `.xlsx` via `xlsxwriter`; default name
  `linkedin_leads_{%Y%m%d_%H%M%S}.xlsx`, sheet `Leads`, header `#4472C4`

---

## E. Extracted fields — original tool

> ⚠️ **This table is historical.** It documents what the old tool *intended* to
> capture. It is **NOT** the schema source of truth — see §E2.

| Field | Type | HTML source | Always present? | Notes |
|---|---|---|---|---|
| `Name` | str | `a[class*=view-profile-image-link]` → `span.a11y-text`; fallback `a[data-x--people-list--person-name]` → `span[class*=lead-detail-entity-details]` | no | fused into `=HYPERLINK()` with URL |
| `Designation` | str | `div[data-anonymize=job-title]` | no | `''` when absent |
| `Company` | str | `a[href*="/sales/company/N"]` → `span[data-anonymize=company-name]` | no | fused into `=HYPERLINK()` |
| `Geography` | str | hovercard `li[data-anonymize=location][aria-hidden=true]`, fallback `td[class*=geography]` | no | |
| `Notes` | str | `div.list-entity-notes__preview-text` → `span[style*="display: inline"]` | no | |
| `Date Entered` | str | `td[class*=date-added]` | no | |

### E2. Extracted fields — CURRENT layout (schema source of truth)

**The authoritative field list is `docs/SELECTOR_MAP.md` §3.** Validated against a
real saved page: **25/25 rows, 100% presence on all ten fields, 25 unique dedupe
keys.**

Summary — `extracted_leads` columns derive from here:

`full_name`, `linkedin_url`, `job_title`, `company_name`, `company_url`,
`location`, `person_blurb`, `tenure_in_role`, `tenure_in_company`, `dedupe_key`

All columns are **nullable** in the schema despite 100% presence on the sample —
one page is not proof of non-nullability.

---

## F. Execution model

- Synchronous, blocking, on the Tk main thread — the UI freezes while parsing
- Single file only; no batch state to leak
- **No module-level mutable state, no globals, no caches.** All state is instance
  or local. Multi-tenant safe in principle.
- No hardcoded paths, no `cwd` dependence. Output defaults beside the input file.
- Loads the entire document into memory, then builds a full BeautifulSoup tree —
  roughly 5–10× file size in RAM
- Two instances could run concurrently in one process without interference

---

## G. Defects

**G1 — 🔴 CRITICAL: every structural selector is dead.**
Measured against a real page saved 2026-08-05:

| Selector | Occurrences |
|---|---|
| `tr[data-x--people-list--row]` | 0 |
| `<tr>` anywhere | 0 |
| `a[class*=view-profile-image-link]` | 0 |
| `span[class*=lead-detail-entity-details]` | 0 |
| `div.list-entity-notes__preview-text` | 0 |
| `td[class*=date-added]` | 0 |
| company hovercard `div#hue-web-tooltip-…` | 0 |

LinkedIn moved from `<table>` to `<ol>/<li>` under `artdeco`/`hue-web`. The tool
extracts **zero leads** and reports "No leads found in the HTML file!" — which
reads as a bad input file, not a broken tool.

**G2 — 🔴 The one surviving selector returns wrong data silently.**
`div[data-anonymize="job-title"]` still matches, but now holds tenure:
`"8 years 7 months in role"` + `"8 years 7 months in company"`. `get_text()`
concatenates them. Every lead's title becomes tenure garbage with no error.
Real titles are at `span[data-anonymize="title"]`.

**G3 — Hardcoded UTF-8 (L175).** Any other encoding kills the entire run.

**G4 — `html.parser` used though `lxml` is bundled (L178).** Slower, more fragile
on malformed markup.

**G5 — Name and URL fused into `=HYPERLINK()` (L231).** Blocks URL-based dedupe and
collides with the export sanitiser (§H2).

**G6 — No deduplication anywhere.**

**G7 — Bare `except Exception` twice (L297, L305)** with the message shown in a
modal. No error typing, no structured logging.

---

## H. Security

| Check | Finding |
|---|---|
| `eval` / `exec` | none |
| `pickle` | none |
| `subprocess` / `os.system` | none |
| `open()` on user path | yes — but user-chosen via file dialog, read-only |
| XXE | not applicable — `html.parser`, not an XML parser |
| Unbounded recursion | **possible** — deeply nested HTML can exhaust the stack |
| ReDoS | low — all regexes are simple, anchored, no nested quantifiers |
| Outbound network | **none** |
| Writes outside output dir | no |

**H1 — Formula injection (outbound).** Not a flaw in the old tool's threat model
(single-user desktop), but fatal in a multi-tenant SaaS. A lead named
`=cmd|'/c calc'!A1` is written to Excel unescaped.

**H2 — 🔴 Direct conflict with spec §12.6.** The tool *deliberately writes formulas*
(`=HYPERLINK(...)`); `sanitizeCell()` *deliberately neuters leading `=`*. These
cannot both hold.

**Resolution (approved):** store `full_name` and `linkedin_url` as separate
columns, keep `sanitizeCell()` exactly as specced, and re-create clickable links
at export time via `xlsxwriter.write_url()` / the XLSX writer's link API — which
the old tool already does for headers, so nothing is lost visually.

---

## I. Performance

- ~1 MB page → 25 leads. Two passes: hovercards, then rows.
- Memory ~5–10× file size from the parse tree
- Degrades non-linearly on deeply nested markup (`html.parser` is pure Python)
- No streaming; a 50 MB file would be fully resident

---

## J. Recommended integration method

### ❌ Options 1, 3, 4 rejected

- **Import as a library** — impossible, it is Python in a Windows binary
- **Separate Python worker** — would faithfully reproduce a parser that extracts
  zero leads. Carrying a Python runtime, container, and queue protocol to run dead
  selectors is pure cost.
- **Subprocess invocation** — same, plus the entire §11.4 sandbox contract

### ✅ Chosen: **Option 2 — port to TypeScript (cheerio)**

Justification against the source actually read:

1. **Extraction logic is ~150 lines** (L159–309), within the spec's threshold
2. **No non-JS dependency in the extraction path** — `pandas`, `numpy`,
   `openpyxl`, `xlsxwriter`, `tkinter` all serve the desktop GUI and Excel export,
   which the SaaS replaces entirely. Only `bs4` + `re` do real work.
3. **bs4 → cheerio is near 1:1** for these operations
4. **The new selectors are plain attribute matches** — `[data-anonymize="…"]` —
   with no regex-on-class-name. They port *more* cleanly than the old code.
5. Eliminates the Python worker, its container, and §11.4 in full

**Golden-file test:** the spec requires proof of equivalence. Since the `.exe`
cannot run here, equivalence is proven against the **validated selector map**, not
the binary: a fixture whose expected output is derived from
`docs/SELECTOR_MAP.md` §3 and confirmed by the Python validation harness that
produced 25/25. Any future selector drift fails the test loudly.

---

## K. Change plan

**MUST MODIFY** — nothing. The original is not carried forward.

**MUST NOT MODIFY** — `NEW_LinkedIn_Lead_Scraper.exe`, `.rar`, and
`recovered/scraper_gui_recovered.py`. All three are frozen evidence. The recovered
file is reference material and must never be imported at runtime.

**WRAP, DON'T EDIT** — not applicable.

**REPLACE** — `scrape_data` → `lib/leads/parse.ts`, built from
`docs/SELECTOR_MAP.md` §3, with:

- encoding detection instead of hardcoded UTF-8 (fixes G3)
- `full_name` / `linkedin_url` as separate fields (fixes G5, resolves H2)
- `job_title` from `span[data-anonymize="title"]` (fixes G2)
- tenure parsed from individual text nodes, never `get_text()` on the parent
- zero-lead result raised as `ERR_FILE_FORMAT`, never a silent empty success (G1)
- typed errors per spec §13.2, no bare `except` (fixes G7)

---

## Phase 1 acceptance

- [x] Sections A–K filled from the actual compiled source, with line references
- [x] Field table complete; §E2 labelled as schema source of truth
- [x] Wish-list fields either in the table or in `docs/UNSUPPORTED_FIELDS.md`
- [x] Zero lines of the original scraper changed
- [x] Zero integration code written
