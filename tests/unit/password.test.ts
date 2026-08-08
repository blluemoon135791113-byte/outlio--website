import { describe, expect, it } from 'vitest'

import { MIN_PASSWORD_LENGTH, checkPassword } from '@/lib/auth/password'

describe('checkPassword — length', () => {
  it(`rejects anything under ${MIN_PASSWORD_LENGTH} characters`, () => {
    const r = checkPassword('Sh0rt!aB')
    expect(r.ok).toBe(false)
  })

  it('accepts a long memorable passphrase', () => {
    expect(checkPassword('correct battery staple lamp').ok).toBe(true)
  })

  it('rejects absurdly long input', () => {
    expect(checkPassword('a'.repeat(500)).ok).toBe(false)
  })
})

describe('checkPassword — common passwords', () => {
  const common = [
    'password1234',
    'Password1234',
    'qwertyuiop',
    'letmein12345',
    'welcome12345',
    'iloveyou1234',
  ]

  for (const p of common) {
    it(`rejects ${p.slice(0, 4)}…`, () => {
      expect(checkPassword(p).ok).toBe(false)
    })
  }

  it('rejects a weak base word even when padded to length', () => {
    expect(checkPassword('password!!!!!!!!!!!!').ok).toBe(false)
  })

  it('rejects the product name as a base word', () => {
    expect(checkPassword('outlio-is-great-2026').ok).toBe(false)
  })
})

describe('checkPassword — patterns', () => {
  it('rejects a single repeated character', () => {
    expect(checkPassword('aaaaaaaaaaaaaaa').ok).toBe(false)
  })

  it('rejects an ascending sequence', () => {
    expect(checkPassword('abcdefghijklmn').ok).toBe(false)
  })

  it('rejects a descending sequence', () => {
    expect(checkPassword('zyxwvutsrqponm').ok).toBe(false)
  })

  it('accepts a passphrase containing an ascending run', () => {
    expect(checkPassword('my abc notebook lives here').ok).toBe(true)
  })
})

describe('checkPassword — no composition rules', () => {
  it('accepts all-lowercase words with no digits or symbols', () => {
    // Deliberate: composition rules push users toward `Password1!`.
    expect(checkPassword('rhubarb tangerine wolf').ok).toBe(true)
  })

  it('gives an actionable reason on failure', () => {
    const r = checkPassword('short')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason.length).toBeGreaterThan(10)
  })
})
