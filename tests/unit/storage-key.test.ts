/**
 * Storage key generation — Phase 6 acceptance (spec §10.4).
 *
 * "A filename containing `../`, a null byte, or a shell metacharacter cannot
 *  influence the storage path — proven by test."
 */
import { describe, expect, it } from 'vitest'

import {
  buildStorageKey,
  keyBelongsToUser,
  sanitizeDisplayFilename,
  sanitizeExportFilename,
} from '@/lib/upload/storage-key'

const USER = '11111111-2222-3333-4444-555555555555'
const JOB = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const FILE = '99999999-8888-7777-6666-555555555555'

describe('buildStorageKey', () => {
  it('produces {user}/{job}/{uuid}.html', () => {
    expect(buildStorageKey(USER, JOB, FILE)).toBe(`${USER}/${JOB}/${FILE}.html`)
  })

  it('lowercases every component', () => {
    const key = buildStorageKey(USER.toUpperCase(), JOB.toUpperCase(), FILE.toUpperCase())
    expect(key).toBe(key.toLowerCase())
  })

  it('contains nothing but hex, hyphens, two slashes and .html', () => {
    expect(buildStorageKey(USER, JOB, FILE)).toMatch(
      /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.html$/,
    )
  })

  it('THE ACCEPTANCE CASE: hostile values cannot reach the key', () => {
    const hostile = [
      '../../etc/passwd',
      '..%2F..%2Fetc%2Fpasswd',
      '/absolute/path',
      'a/../../b',
      'x\u0000.html',
      '; rm -rf /',
      '$(whoami)',
      '`id`',
      'C:\\Windows\\System32',
      '....//....//',
      '\u202Egnp.exe',
    ]

    for (const bad of hostile) {
      // As the user id
      expect(() => buildStorageKey(bad, JOB, FILE), bad).toThrow()
      // As the job id
      expect(() => buildStorageKey(USER, bad, FILE), bad).toThrow()
      // As the file id
      expect(() => buildStorageKey(USER, JOB, bad), bad).toThrow()
    }
  })

  it('rejects anything that is not a UUID', () => {
    for (const bad of ['', 'not-a-uuid', '123', USER.slice(0, -1), `${USER}extra`]) {
      expect(() => buildStorageKey(bad, JOB, FILE), bad).toThrow()
    }
  })
})

describe('keyBelongsToUser', () => {
  it('accepts a key inside the user prefix', () => {
    expect(keyBelongsToUser(buildStorageKey(USER, JOB, FILE), USER)).toBe(true)
  })

  it("rejects another user's key", () => {
    const other = '00000000-0000-0000-0000-000000000001'
    expect(keyBelongsToUser(buildStorageKey(USER, JOB, FILE), other)).toBe(false)
  })

  it('rejects a prefix-collision attempt', () => {
    // A key that merely STARTS with the id but is not under its directory.
    expect(keyBelongsToUser(`${USER}-evil/job/file.html`, USER)).toBe(false)
  })

  it('rejects a non-UUID user id', () => {
    expect(keyBelongsToUser('anything/x.html', '../')).toBe(false)
  })
})

describe('sanitizeDisplayFilename', () => {
  it('keeps an ordinary saved-page name intact', () => {
    expect(sanitizeDisplayFilename('Search _ Sales Navigator.html')).toBe(
      'Search _ Sales Navigator.html',
    )
  })

  it('strips directory components', () => {
    expect(sanitizeDisplayFilename('../../etc/passwd')).toBe('passwd')
    expect(sanitizeDisplayFilename('C:\\Users\\me\\page.html')).toBe('page.html')
    expect(sanitizeDisplayFilename('/var/tmp/page.html')).toBe('page.html')
  })

  it('removes control characters including NUL', () => {
    expect(sanitizeDisplayFilename('page\u0000.html')).toBe('page.html')
    expect(sanitizeDisplayFilename('a\u001Fb.html')).toBe('ab.html')
    expect(sanitizeDisplayFilename('a\u007Fb.html')).toBe('ab.html')
  })

  it('does not leave a hidden-file name', () => {
    expect(sanitizeDisplayFilename('...hidden.html')).toBe('hidden.html')
  })

  it('falls back when nothing survives', () => {
    expect(sanitizeDisplayFilename('')).toBe('untitled.html')
    expect(sanitizeDisplayFilename('///')).toBe('untitled.html')
    expect(sanitizeDisplayFilename('\u0000')).toBe('untitled.html')
  })

  it('caps the length', () => {
    expect(sanitizeDisplayFilename(`${'a'.repeat(400)}.html`).length).toBeLessThanOrEqual(255)
  })

  it('keeps shell metacharacters as TEXT — they never reach a shell', () => {
    // Retained deliberately: this is a display string, and mangling the user's
    // filename is worse than showing it. Nothing executes it, and the storage
    // key is built from UUIDs so this value cannot influence any path.
    // NOTE: no slash here on purpose — a slash makes it a path, and everything
    // before the final slash is correctly discarded as a directory component.
    expect(sanitizeDisplayFilename('; rm -rf ~ .html')).toContain('rm -rf')
    expect(sanitizeDisplayFilename('$(whoami).html')).toContain('$(whoami)')
    expect(sanitizeDisplayFilename('`id`.html')).toContain('`id`')
  })

  it('treats anything before a slash as a directory and discards it', () => {
    // The security-relevant half of the above: a metacharacter payload that
    // includes a slash loses everything up to the last one.
    expect(sanitizeDisplayFilename('; rm -rf / .html')).toBe('html')
  })
})

describe('sanitizeExportFilename', () => {
  it('restricts to [A-Za-z0-9._-]', () => {
    expect(sanitizeExportFilename('my leads 2026')).toMatch(/^[A-Za-z0-9._-]+$/)
  })

  it('strips directories and extensions', () => {
    expect(sanitizeExportFilename('../../etc/passwd.csv')).toBe('passwd')
  })

  it('neutralises shell metacharacters here, because this DOES reach a header', () => {
    for (const bad of ['; rm -rf /', '$(id)', '`whoami`', 'a"b', "a'b", 'a\nb']) {
      expect(sanitizeExportFilename(bad), bad).toMatch(/^[A-Za-z0-9._-]+$/)
    }
  })

  it('falls back when nothing survives', () => {
    expect(sanitizeExportFilename('')).toBe('export')
    expect(sanitizeExportFilename('///')).toBe('export')
    expect(sanitizeExportFilename('...')).toBe('export')
  })

  it('caps the length', () => {
    expect(sanitizeExportFilename('a'.repeat(300)).length).toBeLessThanOrEqual(100)
  })
})
