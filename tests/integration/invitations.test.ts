/**
 * Invitation redemption and entitlement granting — Phase 5 acceptance.
 *
 * Spec §9.4: "Concurrent redemption of a max_uses = 1 code succeeds exactly
 * once — proven by a test."
 *
 * These run against the real Supabase project and are skipped when the
 * environment is not configured.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  adminClient,
  createAuthUser,
  deleteTestUser,
  hasSupabaseEnv,
  type TestAuthUser,
} from './helpers'

const describeIf = hasSupabaseEnv ? describe : describe.skip

function randomCode(label: string): string {
  return `TEST-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

async function trialPlanId(): Promise<string> {
  const { data, error } = await adminClient()
    .from('plans')
    .select('id')
    .eq('key', 'trial')
    .single()
  if (error || !data) throw new Error(`trial plan lookup failed: ${error?.message}`)
  return data.id
}

async function createCode(code: string, maxUses: number, planId: string) {
  const { error } = await adminClient().from('invitation_codes').insert({
    code,
    plan_id: planId,
    max_uses: maxUses,
    used_count: 0,
    is_active: true,
  })
  if (error) throw new Error(`createCode failed: ${error.message}`)
}

async function redeem(code: string, userId: string): Promise<string> {
  const { data, error } = await adminClient().rpc('redeem_invitation_code', {
    p_code: code,
    p_user_id: userId,
  })
  if (error) throw new Error(`redeem rpc failed: ${error.message}`)
  return String(data)
}

async function cleanupCode(code: string) {
  await adminClient().from('invitation_codes').delete().eq('code', code)
}

describeIf('Invitation codes', () => {
  let planId: string
  const createdUsers: string[] = []
  const createdCodes: string[] = []

  beforeAll(async () => {
    planId = await trialPlanId()
  })

  afterAll(async () => {
    // Parallel, and settled rather than all — one failed delete must not
    // abandon the rest of the cleanup.
    await Promise.allSettled([
      ...createdUsers.map((id) => deleteTestUser(id)),
      ...createdCodes.map((c) => cleanupCode(c)),
    ])
  })

  /**
   * Every assertion here goes through service-role RPCs, so these users never
   * need an authenticated client. Not signing them in keeps the suite off
   * Supabase's per-IP token rate limit.
   */
  async function user(label: string): Promise<TestAuthUser> {
    const u = await createAuthUser(label)
    createdUsers.push(u.id)
    return u
  }

  it('redeems a valid code and grants access', async () => {
    const code = randomCode('valid')
    createdCodes.push(code)
    await createCode(code, 1, planId)

    const u = await user('redeem-ok')
    expect(await redeem(code, u.id)).toBe('ok')

    const { data: profile } = await adminClient()
      .from('profiles')
      .select('role, plan_id')
      .eq('id', u.id)
      .single()

    expect(profile?.role).toBe('subscriber')
    expect(profile?.plan_id).toBe(planId)
  })

  it('creates a subscription row and an audit log entry', async () => {
    const code = randomCode('audit')
    createdCodes.push(code)
    await createCode(code, 1, planId)

    const u = await user('redeem-audit')
    expect(await redeem(code, u.id)).toBe('ok')

    const { data: subs } = await adminClient()
      .from('subscriptions')
      .select('status, provider')
      .eq('user_id', u.id)

    expect(subs).toHaveLength(1)
    expect(subs?.[0]?.status).toBe('active')
    expect(subs?.[0]?.provider).toBe('invitation')

    const { data: audit } = await adminClient()
      .from('admin_audit_logs')
      .select('action')
      .eq('target_user_id', u.id)
      .eq('action', 'entitlement.grant')

    expect(audit?.length).toBeGreaterThanOrEqual(1)
  })

  it('rejects an unknown code', async () => {
    const u = await user('redeem-unknown')
    expect(await redeem(randomCode('nope'), u.id)).toBe('invalid')
  })

  it('rejects an inactive code as unavailable, not invalid', async () => {
    const code = randomCode('inactive')
    createdCodes.push(code)
    await createCode(code, 1, planId)
    await adminClient()
      .from('invitation_codes')
      .update({ is_active: false })
      .eq('code', code)

    const u = await user('redeem-inactive')
    expect(await redeem(code, u.id)).toBe('unavailable')
  })

  it('rejects an expired code', async () => {
    const code = randomCode('expired')
    createdCodes.push(code)
    await createCode(code, 1, planId)
    await adminClient()
      .from('invitation_codes')
      .update({ expires_at: '2020-01-01T00:00:00Z' })
      .eq('code', code)

    const u = await user('redeem-expired')
    expect(await redeem(code, u.id)).toBe('unavailable')
  })

  it('refuses a second redemption by an already-active user', async () => {
    const codeA = randomCode('firstA')
    const codeB = randomCode('firstB')
    createdCodes.push(codeA, codeB)
    await createCode(codeA, 1, planId)
    await createCode(codeB, 1, planId)

    const u = await user('redeem-twice')
    expect(await redeem(codeA, u.id)).toBe('ok')
    expect(await redeem(codeB, u.id)).toBe('already_active')
  })

  // -------------------------------------------------------------------------
  // The acceptance criterion.
  // -------------------------------------------------------------------------

  it('CONCURRENCY: a max_uses=1 code is redeemed exactly once by 5 racing users', async () => {
    const code = randomCode('race1')
    createdCodes.push(code)
    await createCode(code, 1, planId)

    const users = await Promise.all([
      user('race-a'),
      user('race-b'),
      user('race-c'),
      user('race-d'),
      user('race-e'),
    ])

    // Fire all five simultaneously.
    const results = await Promise.all(users.map((u) => redeem(code, u.id)))

    const successes = results.filter((r) => r === 'ok')
    expect(successes).toHaveLength(1)

    const { data: row } = await adminClient()
      .from('invitation_codes')
      .select('used_count')
      .eq('code', code)
      .single()

    expect(row?.used_count).toBe(1)

    // Exactly one user became a subscriber.
    const { data: profiles } = await adminClient()
      .from('profiles')
      .select('role')
      .in('id', users.map((u) => u.id))

    expect(profiles?.filter((p) => p.role === 'subscriber')).toHaveLength(1)
  })

  it('CONCURRENCY: a max_uses=3 code is redeemed exactly three times by 8 racing users', async () => {
    const code = randomCode('race3')
    createdCodes.push(code)
    await createCode(code, 3, planId)

    const users = await Promise.all(
      Array.from({ length: 8 }, (_, i) => user(`race3-${i}`)),
    )

    const results = await Promise.all(users.map((u) => redeem(code, u.id)))
    expect(results.filter((r) => r === 'ok')).toHaveLength(3)

    const { data: row } = await adminClient()
      .from('invitation_codes')
      .select('used_count')
      .eq('code', code)
      .single()

    expect(row?.used_count).toBe(3)
  })
})
