/**
 * Content sniffing for uploaded files (spec §10.2 step 4).
 *
 * Pure — no I/O, no secrets — so every branch is unit-testable.
 *
 * ⚠️ THE FILE EXTENSION AND DECLARED MIME TYPE ARE HINTS, NEVER PROOF.
 * Both are fully attacker-controlled. Only the bytes are evidence.
 */

export const SNIFF_BYTES = 4096

export type SniffOk = { ok: true; encoding: 'utf-8' | 'utf-16le' | 'utf-16be' }
export type SniffFail = {
  ok: false
  /** Maps onto the error catalog. */
  code: 'ERR_FILE_EMPTY' | 'ERR_FILE_TYPE' | 'ERR_FILE_FORMAT'
  /** For logs. Never contains file content. */
  detail: string
}
export type SniffResult = SniffOk | SniffFail

/**
 * Known binary signatures. A file whose leading bytes match any of these is
 * rejected outright, regardless of what it claims to be.
 */
const BINARY_SIGNATURES: ReadonlyArray<{ label: string; bytes: readonly number[] }> = [
  { label: 'ZIP/OOXML', bytes: [0x50, 0x4b, 0x03, 0x04] }, // PK\x03\x04
  { label: 'ZIP (empty)', bytes: [0x50, 0x4b, 0x05, 0x06] },
  { label: 'ZIP (spanned)', bytes: [0x50, 0x4b, 0x07, 0x08] },
  { label: 'PDF', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { label: 'ELF', bytes: [0x7f, 0x45, 0x4c, 0x46] },
  { label: 'DOS/PE executable', bytes: [0x4d, 0x5a] }, // MZ
  { label: 'PNG', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { label: 'GIF', bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  { label: 'JPEG', bytes: [0xff, 0xd8, 0xff] },
  { label: 'GZIP', bytes: [0x1f, 0x8b] },
  { label: 'BZIP2', bytes: [0x42, 0x5a, 0x68] },
  { label: 'XZ', bytes: [0xfd, 0x37, 0x7a, 0x58, 0x5a] },
  { label: '7-Zip', bytes: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c] },
  { label: 'RAR', bytes: [0x52, 0x61, 0x72, 0x21] }, // Rar!
  { label: 'Mach-O 64', bytes: [0xcf, 0xfa, 0xed, 0xfe] },
  { label: 'Mach-O 32', bytes: [0xce, 0xfa, 0xed, 0xfe] },
  { label: 'Java class', bytes: [0xca, 0xfe, 0xba, 0xbe] },
  { label: 'MS Office (legacy)', bytes: [0xd0, 0xcf, 0x11, 0xe0] },
  { label: 'SQLite', bytes: [0x53, 0x51, 0x4c, 0x69] }, // SQLi
  { label: 'WASM', bytes: [0x00, 0x61, 0x73, 0x6d] },
]

/** Markers that identify the payload as HTML. Case-insensitive. */
const HTML_MARKERS = ['<!doctype html', '<html', '<body', '<head'] as const

function startsWith(buf: Uint8Array, sig: readonly number[]): boolean {
  if (buf.length < sig.length) return false
  for (let i = 0; i < sig.length; i++) {
    if (buf[i] !== sig[i]) return false
  }
  return true
}

/**
 * Detects a byte-order mark and reports the encoding to decode with.
 *
 * Matters because a page saved as UTF-16 is legitimate HTML whose bytes look
 * like `<\0h\0t\0m\0l\0` — a naive UTF-8 decode finds no markers and would
 * wrongly reject a valid file. The original scraper's hardcoded UTF-8 read is
 * exactly this bug (docs/SCRAPER_AUDIT.md §G3).
 */
function detectEncoding(buf: Uint8Array): SniffOk['encoding'] {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return 'utf-16le'
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) return 'utf-16be'
  // No BOM: infer UTF-16LE from interleaved NULs in an ASCII-ish prefix.
  if (buf.length >= 8) {
    let evenNul = 0
    let oddNul = 0
    const window = Math.min(buf.length, 64)
    for (let i = 0; i < window; i++) {
      if (buf[i] !== 0x00) continue
      if (i % 2 === 0) evenNul += 1
      else oddNul += 1
    }
    if (oddNul > window / 4 && evenNul === 0) return 'utf-16le'
    if (evenNul > window / 4 && oddNul === 0) return 'utf-16be'
  }
  return 'utf-8'
}

function decodePrefix(buf: Uint8Array, encoding: SniffOk['encoding']): string {
  try {
    // fatal:false so malformed sequences become U+FFFD rather than throwing —
    // we are inspecting, not trusting.
    return new TextDecoder(encoding, { fatal: false }).decode(buf)
  } catch {
    return ''
  }
}

/**
 * Inspects the leading bytes of an upload.
 *
 * @param prefix first `SNIFF_BYTES` (or fewer, if the file is smaller)
 * @param totalBytes full file size, used for the empty check
 */
export function sniffHtml(prefix: Uint8Array, totalBytes: number): SniffResult {
  if (totalBytes === 0 || prefix.length === 0) {
    return { ok: false, code: 'ERR_FILE_EMPTY', detail: 'zero-length file' }
  }

  for (const sig of BINARY_SIGNATURES) {
    if (startsWith(prefix, sig.bytes)) {
      return {
        ok: false,
        code: 'ERR_FILE_TYPE',
        detail: `binary signature: ${sig.label}`,
      }
    }
  }

  const encoding = detectEncoding(prefix)
  const text = decodePrefix(prefix, encoding)

  if (text.trim().length === 0) {
    return { ok: false, code: 'ERR_FILE_EMPTY', detail: 'whitespace-only file' }
  }

  // A NUL in text decoded as UTF-8 means it is not really text.
  if (encoding === 'utf-8' && text.includes('\u0000')) {
    return {
      ok: false,
      code: 'ERR_FILE_TYPE',
      detail: 'NUL byte in a file decoded as UTF-8',
    }
  }

  const haystack = text.toLowerCase()
  const found = HTML_MARKERS.some((m) => haystack.includes(m))

  if (!found) {
    return {
      ok: false,
      code: 'ERR_FILE_FORMAT',
      detail: `no HTML marker in the first ${prefix.length} bytes`,
    }
  }

  return { ok: true, encoding }
}

// ---------------------------------------------------------------------------
// Extension and declared MIME — hints only, checked before sniffing to fail
// fast and give a clearer message.
// ---------------------------------------------------------------------------

const ALLOWED_EXTENSIONS = ['.html', '.htm'] as const

export function hasAllowedExtension(filename: string): boolean {
  const lower = filename.toLowerCase().trim()
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/**
 * Browsers send an empty string or `application/octet-stream` often enough that
 * an absent type must not be a hard failure. A type that is positively wrong
 * (e.g. `image/png`) is.
 */
export function hasPlausibleMimeType(declared: string | null | undefined): boolean {
  if (!declared) return true
  const type = declared.split(';')[0]?.trim().toLowerCase() ?? ''
  if (type === '' || type === 'application/octet-stream') return true
  return type === 'text/html' || type === 'text/plain'
}
