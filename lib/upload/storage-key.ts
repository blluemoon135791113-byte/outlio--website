/**
 * Storage key generation and filename handling.
 *
 * Pure — no I/O — so the traversal defences are exhaustively testable.
 *
 * ⚠️ A STORAGE KEY IS NEVER DERIVED FROM A USER-SUPPLIED FILENAME.
 *
 * The key is composed entirely from values the server controls:
 *
 *     {user_id}/{job_id}/{uuid}.html
 *
 * All three are UUIDs the server generated or read from a verified session, so
 * `../`, null bytes, shell metacharacters and absolute paths in the uploaded
 * filename cannot influence where anything is written. The original filename is
 * retained only as a display string in the database.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Builds the object key.
 *
 * Every component is validated as a UUID first. That check is not paranoia
 * theatre: it guarantees the produced key contains nothing but hex, hyphens and
 * two slashes, so it is structurally incapable of escaping the user's prefix.
 */
export function buildStorageKey(
  userId: string,
  jobId: string,
  fileId: string,
): string {
  for (const [name, value] of [
    ['userId', userId],
    ['jobId', jobId],
    ['fileId', fileId],
  ] as const) {
    if (!UUID_RE.test(value)) {
      throw new Error(`buildStorageKey: ${name} is not a UUID`)
    }
  }

  return `${userId.toLowerCase()}/${jobId.toLowerCase()}/${fileId.toLowerCase()}.html`
}

/** True when a key sits inside the given user's prefix. Used before signing URLs. */
export function keyBelongsToUser(key: string, userId: string): boolean {
  if (!UUID_RE.test(userId)) return false
  return key.startsWith(`${userId.toLowerCase()}/`)
}

// ---------------------------------------------------------------------------
// Display filename
// ---------------------------------------------------------------------------

const MAX_DISPLAY_NAME = 255

/**
 * Sanitises a user-supplied filename for DISPLAY AND STORAGE AS TEXT ONLY.
 *
 * This value must never reach a filesystem path, a shell argument, or a storage
 * key. It exists so the UI can show "Search _ Sales Navigator.html" next to a
 * row. Escaping on render is React's job; this strips the things that have no
 * business in a display string at all.
 */
export function sanitizeDisplayFilename(raw: string): string {
  let name = String(raw ?? '')

  // Strip any directory component from every path convention.
  name = name.split(/[/\\]/).pop() ?? ''

  // Remove control characters, including NUL. Written as explicit \u escapes
  // rather than literal bytes so the intent survives copy/paste and formatting.
  name = name.replace(/[\u0000-\u001F\u007F]/g, '')

  // Collapse whitespace and trim leading dots so nothing renders as hidden.
  name = name.replace(/\s+/g, ' ').trim().replace(/^\.+/, '')

  if (name.length > MAX_DISPLAY_NAME) {
    name = name.slice(0, MAX_DISPLAY_NAME)
  }

  return name || 'untitled.html'
}

/**
 * Sanitises a user-chosen EXPORT filename (spec §12.6).
 *
 * Stricter than the display name because this one does become part of a
 * `Content-Disposition` header and a downloaded file's name.
 */
export function sanitizeExportFilename(raw: string, fallback = 'export'): string {
  let name = String(raw ?? '')

  name = name.split(/[/\\]/).pop() ?? ''
  name = name.replace(/\.[A-Za-z0-9]{1,8}$/, '') // drop any extension
  name = name.replace(/[^A-Za-z0-9._-]/g, '-') // spec: [A-Za-z0-9._-]
  name = name.replace(/-{2,}/g, '-').replace(/^[.-]+|[.-]+$/g, '')

  if (name.length > 100) name = name.slice(0, 100)

  return name || fallback
}
