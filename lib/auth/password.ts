/**
 * Password policy — spec §8.3.
 *
 * Minimum 12 characters, checked against a common-password deny-list.
 * Deliberately NO composition rules (no "must contain a symbol"): they push
 * users toward predictable patterns like `Password1!` and measurably weaken
 * real-world passwords.
 */

export const MIN_PASSWORD_LENGTH = 12
export const MAX_PASSWORD_LENGTH = 128

/**
 * Common passwords and predictable base words. Compared case-insensitively,
 * both exactly and as a substring for the base words, so `Password123456`
 * is rejected as well as `password`.
 */
const COMMON_EXACT = new Set([
  '123456789012', '123456789', '1234567890', '12345678', 'password',
  'password123', 'password1234', 'passw0rd123', 'qwertyuiop', 'qwerty123',
  'letmein12345', 'welcome12345', 'admin1234567', 'iloveyou1234',
  'monkey123456', 'dragon123456', 'sunshine1234', 'princess1234',
  'football1234', 'baseball1234', 'trustno12345', 'superman1234',
  'starwars1234', 'whatever1234', 'freedom12345', 'computer1234',
  'michael12345', 'shadow123456', 'master123456', 'jennifer1234',
  'jordan123456', 'hunter123456', 'harley123456', 'ranger123456',
  'buster123456', 'thomas123456', 'robert123456', 'soccer123456',
  'batman123456', 'test12345678', 'pass12345678', 'hello1234567',
  'charlie12345', 'donald123456', 'qazwsxedcrfv', 'zaq12wsxcde3',
])

/** Base words that make a password guessable regardless of padding. */
const WEAK_BASES = [
  'password', 'qwerty', 'asdfgh', 'zxcvbn', 'letmein', 'welcome',
  'iloveyou', 'admin', 'administrator', 'changeme', 'secret',
  'outlio', 'linkedin', 'salesnav', 'monkey', 'dragon', 'sunshine',
  'princess', 'football', 'baseball', 'trustno1', 'superman', 'starwars',
  'abc123', 'qwertyui', '11111111', '00000000', '12345678', '87654321',
]

export type PasswordCheck =
  | { ok: true }
  | { ok: false; reason: string }

export function checkPassword(password: string): PasswordCheck {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      reason: `Use at least ${MIN_PASSWORD_LENGTH} characters. A short phrase you'll remember works well.`,
    }
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, reason: `Keep it under ${MAX_PASSWORD_LENGTH} characters.` }
  }

  const lower = password.toLowerCase()

  if (COMMON_EXACT.has(lower)) {
    return { ok: false, reason: 'That password is too common. Choose something less predictable.' }
  }

  for (const base of WEAK_BASES) {
    if (lower.includes(base)) {
      return {
        ok: false,
        reason: 'That password contains a very common word. Choose something less predictable.',
      }
    }
  }

  // A single repeated character, e.g. "aaaaaaaaaaaa".
  if (/^(.)\1+$/.test(password)) {
    return { ok: false, reason: 'That password is too repetitive.' }
  }

  // Straight ascending or descending runs, e.g. "abcdefghijkl".
  if (isSequential(lower)) {
    return { ok: false, reason: 'Avoid simple sequences like `abcdefghijkl`.' }
  }

  return { ok: true }
}

function isSequential(value: string): boolean {
  if (value.length < MIN_PASSWORD_LENGTH) return false
  let ascending = true
  let descending = true
  for (let i = 1; i < value.length; i++) {
    const delta = value.charCodeAt(i) - value.charCodeAt(i - 1)
    if (delta !== 1) ascending = false
    if (delta !== -1) descending = false
    if (!ascending && !descending) return false
  }
  return ascending || descending
}
