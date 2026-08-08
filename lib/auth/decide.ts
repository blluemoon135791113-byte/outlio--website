/**
 * The access decision, as a PURE function.
 *
 * Deliberately separated from `access.ts` so every branch is unit-testable
 * without a Next.js request context or a database. `access.ts` fetches the
 * inputs; this file decides. Security logic that cannot be tested exhaustively
 * tends not to be.
 *
 * NOT server-only: it touches no secrets and performs no I/O.
 */
import type { PlanLimits, ProfileRow, UserRole } from '@/types/database'

export type AccessReason =
  | 'ok'
  | 'unauthenticated'
  | 'email_unverified'
  | 'no_request'
  | 'pending'
  | 'rejected'
  | 'expired'
  | 'suspended'
  | 'limit_reached'
  | 'payment_required'

/** Roles permitted to run extractions, before expiry/suspension/limit checks. */
export const SCRAPER_ROLES: readonly UserRole[] = [
  'approved_user',
  'subscriber',
  'admin',
]

export type DecisionInput = {
  profile: Pick<
    ProfileRow,
    'role' | 'access_expires_at' | 'suspended_at' | 'deleted_at'
  > | null
  emailVerified: boolean
  limits: PlanLimits | null
  usage: {
    extractionsToday: number
    extractionsThisMonth: number
    recordsThisMonth: number
  } | null
  now?: Date
}

export type Decision = { canUseScraper: boolean; reason: AccessReason }

const ALLOW: Decision = { canUseScraper: true, reason: 'ok' }
const deny = (reason: AccessReason): Decision => ({ canUseScraper: false, reason })

/** `null` limit means unlimited. */
export function withinLimit(limit: number | null, current: number): boolean {
  if (limit === null) return true
  return current < limit
}

/** Sentinel: pre-checks passed, the plan/usage checks still have to run. */
export const NEEDS_LIMITS = 'needs_limits' as const

export type PrecheckResult = Decision | typeof NEEDS_LIMITS

/**
 * Everything decidable from the profile alone — no plan or usage required.
 *
 * Split out so callers can avoid two database round trips for users who are
 * going to be denied anyway (signed out, unverified, wrong role). That is not
 * only faster: it means an outage in the usage tables cannot break the
 * sign-in and verify-email pages.
 *
 * Order matters. The most specific, most actionable reason wins so the UI can
 * distinguish "suspended" from "expired" from "still pending".
 */
export function precheckAccess(
  input: Omit<DecisionInput, 'limits' | 'usage'>,
): PrecheckResult {
  const { profile, emailVerified } = input
  const now = input.now ?? new Date()

  if (!profile || profile.deleted_at) return deny('unauthenticated')

  // Suspension outranks everything, including admin.
  if (profile.role === 'suspended_user' || profile.suspended_at) {
    return deny('suspended')
  }

  if (!emailVerified) return deny('email_unverified')

  if (!SCRAPER_ROLES.includes(profile.role)) {
    return deny(profile.role === 'pending_user' ? 'pending' : 'no_request')
  }

  if (
    profile.access_expires_at &&
    new Date(profile.access_expires_at).getTime() <= now.getTime()
  ) {
    return deny('expired')
  }

  // Admins bypass plan limits, but never suspension or expiry above.
  if (profile.role === 'admin') return ALLOW

  return NEEDS_LIMITS
}

/** The plan/usage half. Only meaningful after `precheckAccess` returns NEEDS_LIMITS. */
export function decideLimits(
  limits: DecisionInput['limits'],
  usage: DecisionInput['usage'],
): Decision {
  if (!limits || !usage) return deny('payment_required')

  if (!withinLimit(limits.extractions_per_day, usage.extractionsToday)) {
    return deny('limit_reached')
  }
  if (!withinLimit(limits.extractions_per_month, usage.extractionsThisMonth)) {
    return deny('limit_reached')
  }
  if (!withinLimit(limits.records_per_month, usage.recordsThisMonth)) {
    return deny('limit_reached')
  }

  return ALLOW
}

/** The whole decision. Composes both halves. */
export function decideAccess(input: DecisionInput): Decision {
  const pre = precheckAccess(input)
  if (pre !== NEEDS_LIMITS) return pre
  return decideLimits(input.limits, input.usage)
}
