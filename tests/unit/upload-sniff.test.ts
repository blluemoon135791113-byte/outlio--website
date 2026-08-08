/**
 * Content sniffing — Phase 6 acceptance (spec §10.4).
 *
 * "A .exe renamed to .html is rejected by content sniffing — proven by a
 *  fixture test."
 *
 * The extension and declared MIME are attacker-controlled. Only bytes count.
 */
import { describe, expect, it } from 'vitest'

import {
  SNIFF_BYTES,
  hasAllowedExtension,
  hasPlausibleMimeType,
  sniffHtml,
} from '@/lib/upload/sniff'

const enc = new TextEncoder()

function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values)
}

/** Binary signature followed by plausible-looking filler. */
function binaryFile(sig: number[]): Uint8Array {
  return new Uint8Array([...sig, ...new Array(64).fill(0x41)])
}

function utf16le(text: string): Uint8Array {
  const out = new Uint8Array(2 + text.length * 2)
  out[0] = 0xff
  out[1] = 0xfe
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    out[2 + i * 2] = code & 0xff
    out[3 + i * 2] = code >> 8
  }
  return out
}

describe('sniffHtml — accepts real HTML', () => {
  const valid = [
    '<!DOCTYPE html><html><body>hi</body></html>',
    '<!doctype html>\n<html lang="en">',
    '<html><head><title>t</title></head></html>',
    '\n\n   <!DOCTYPE HTML>\n<HTML>',
    '<body>fragment saved without a doctype</body>',
  ]

  for (const html of valid) {
    it(`accepts ${JSON.stringify(html.slice(0, 28))}…`, () => {
      const buf = enc.encode(html)
      expect(sniffHtml(buf, buf.length)).toEqual({ ok: true, encoding: 'utf-8' })
    })
  }

  it('accepts UTF-16LE HTML with a BOM', () => {
    const buf = utf16le('<!DOCTYPE html><html><body>x</body></html>')
    const r = sniffHtml(buf, buf.length)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.encoding).toBe('utf-16le')
  })
})

describe('sniffHtml — rejects binaries regardless of extension', () => {
  const signatures: Array<[string, number[]]> = [
    ['Windows .exe (MZ)', [0x4d, 0x5a, 0x90, 0x00]],
    ['ZIP / .docx / .xlsx', [0x50, 0x4b, 0x03, 0x04]],
    ['PDF', [0x25, 0x50, 0x44, 0x46, 0x2d]],
    ['ELF', [0x7f, 0x45, 0x4c, 0x46]],
    ['PNG', [0x89, 0x50, 0x4e, 0x47]],
    ['GIF', [0x47, 0x49, 0x46, 0x38, 0x39]],
    ['JPEG', [0xff, 0xd8, 0xff, 0xe0]],
    ['GZIP', [0x1f, 0x8b, 0x08]],
    ['RAR', [0x52, 0x61, 0x72, 0x21]],
    ['7-Zip', [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]],
    ['Mach-O', [0xcf, 0xfa, 0xed, 0xfe]],
    ['Java class', [0xca, 0xfe, 0xba, 0xbe]],
    ['Legacy Office', [0xd0, 0xcf, 0x11, 0xe0]],
    ['SQLite', [0x53, 0x51, 0x4c, 0x69]],
    ['WASM', [0x00, 0x61, 0x73, 0x6d]],
  ]

  for (const [label, sig] of signatures) {
    it(`rejects ${label}`, () => {
      const buf = binaryFile(sig)
      const r = sniffHtml(buf, buf.length)
      expect(r.ok, label).toBe(false)
      if (!r.ok) expect(r.code).toBe('ERR_FILE_TYPE')
    })
  }

  it('THE ACCEPTANCE CASE: a real PE header named .html is rejected', () => {
    // "MZ" + DOS stub — what you get renaming scraper.exe to scraper.html
    const pe = new Uint8Array(512)
    pe.set([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00], 0)
    pe.set(enc.encode('This program cannot be run in DOS mode.'), 0x4e)

    expect(hasAllowedExtension('scraper.html')).toBe(true) // extension lies
    const r = sniffHtml(pe, pe.length)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.code).toBe('ERR_FILE_TYPE')
      expect(r.detail).toContain('PE executable')
    }
  })
})

describe('sniffHtml — rejects empty and non-HTML text', () => {
  it('rejects a zero-byte file', () => {
    const r = sniffHtml(new Uint8Array(0), 0)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('ERR_FILE_EMPTY')
  })

  it('rejects a whitespace-only file', () => {
    const buf = enc.encode('   \n\t\r\n   ')
    const r = sniffHtml(buf, buf.length)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('ERR_FILE_EMPTY')
  })

  it('rejects plain text with no HTML marker', () => {
    const buf = enc.encode('just some notes I wrote down, no markup at all')
    const r = sniffHtml(buf, buf.length)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('ERR_FILE_FORMAT')
  })

  it('rejects JSON and CSV', () => {
    for (const text of ['{"leads":[]}', 'name,company\nA,B']) {
      const buf = enc.encode(text)
      const r = sniffHtml(buf, buf.length)
      expect(r.ok, text).toBe(false)
    }
  })

  it('rejects a NUL byte inside UTF-8 text', () => {
    const buf = bytes(0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e, 0x00, 0x41)
    const r = sniffHtml(buf, buf.length)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('ERR_FILE_TYPE')
  })

  it('rejects HTML that appears only AFTER the sniff window', () => {
    // Padding beyond SNIFF_BYTES, then markup. We only ever see the prefix,
    // so this must fail rather than be trusted.
    const prefix = enc.encode('x'.repeat(SNIFF_BYTES))
    const r = sniffHtml(prefix, SNIFF_BYTES + 100)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe('ERR_FILE_FORMAT')
  })
})

describe('extension and MIME are hints only', () => {
  it('accepts .html and .htm, case-insensitively', () => {
    for (const n of ['a.html', 'a.HTML', 'a.htm', 'Search _ Sales Navigator.html']) {
      expect(hasAllowedExtension(n), n).toBe(true)
    }
  })

  it('rejects other extensions', () => {
    for (const n of ['a.exe', 'a.pdf', 'a.html.exe', 'a', 'a.htmlx']) {
      expect(hasAllowedExtension(n), n).toBe(false)
    }
  })

  it('tolerates a missing or generic MIME type', () => {
    expect(hasPlausibleMimeType(null)).toBe(true)
    expect(hasPlausibleMimeType('')).toBe(true)
    expect(hasPlausibleMimeType('application/octet-stream')).toBe(true)
    expect(hasPlausibleMimeType('text/html; charset=utf-8')).toBe(true)
  })

  it('rejects a positively wrong MIME type', () => {
    for (const t of ['image/png', 'application/pdf', 'application/zip']) {
      expect(hasPlausibleMimeType(t), t).toBe(false)
    }
  })

  it('a valid extension does NOT rescue binary content', () => {
    expect(hasAllowedExtension('totally-legit.html')).toBe(true)
    const buf = binaryFile([0x50, 0x4b, 0x03, 0x04])
    expect(sniffHtml(buf, buf.length).ok).toBe(false)
  })
})
