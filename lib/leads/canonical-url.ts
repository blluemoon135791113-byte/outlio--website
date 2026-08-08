/**
 * URL canonicalisation (spec §12.2).
 *
 * Pure — no I/O. These values become dedupe keys, so stability across saves is
 * the whole requirement.
 */

/**
 * Canonicalises a Sales Navigator lead URL to `li:lead:{id}`.
 *
 * Real hrefs look like:
 *   https://www.linkedin.com/sales/lead/ACwAAAX_XXkBgA,NAME_SEARCH,yyu9?_ntb=…
 *
 * Everything after the first comma is session-scoped and CHANGES BETWEEN SAVES.
 * Keeping it would give the same person a different key in every export, which
 * defeats deduplication entirely. Validated on real pages: 30/30 unique keys
 * across two saves (docs/SELECTOR_MAP.md §5).
 */
export function canonicalizeLeadUrl(url: string | null | undefined): string | null {
  if (!url) return null

  const match = /\/sales\/lead\/([^,?/#]+)/i.exec(url)
  if (match?.[1]) return `li:lead:${match[1]}`

  // Public profile form: /in/{slug}
  const inMatch = /\/in\/([^/?#]+)/i.exec(url)
  if (inMatch?.[1]) {
    try {
      return `li:in:${decodeURIComponent(inMatch[1]).toLowerCase()}`
    } catch {
      return `li:in:${inMatch[1].toLowerCase()}`
    }
  }

  return normalizeRawUrl(url)
}

/** Canonicalises a company URL to `li:company:{id}`. */
export function canonicalizeCompanyUrl(url: string | null | undefined): string | null {
  if (!url) return null

  const match = /\/sales\/company\/(\d+)/i.exec(url)
  if (match?.[1]) return `li:company:${match[1]}`

  const slugMatch = /\/company\/([^/?#]+)/i.exec(url)
  if (slugMatch?.[1]) return `li:company:${slugMatch[1].toLowerCase()}`

  return normalizeRawUrl(url)
}

/**
 * Fallback for anything unrecognised: strip protocol, `www.`, query, fragment,
 * trailing slash and locale path prefixes, then lowercase the host.
 */
function normalizeRawUrl(url: string): string | null {
  let candidate = url.trim()
  if (!candidate) return null
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    return null
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
  const segments = parsed.pathname
    .split('/')
    .filter(Boolean)
    // Drop a two-letter locale prefix such as /en/ or /de/
    .filter((s, i) => !(i === 0 && /^[a-z]{2}$/i.test(s)))

  const path = segments.join('/').toLowerCase()
  return `li:raw:${host}${path ? `/${path}` : ''}`
}

/**
 * Absolutises a LinkedIn href.
 *
 * Sales Navigator sometimes emits root-relative hrefs (`/sales/company/123`).
 * The stored value should always be clickable.
 */
export function absolutizeLinkedInUrl(href: string | null | undefined): string | null {
  if (!href) return null
  const trimmed = href.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/')) return `https://www.linkedin.com${trimmed}`
  return trimmed
}
