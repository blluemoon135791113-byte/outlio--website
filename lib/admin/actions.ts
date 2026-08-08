'use server'

/**
 * Admin actions.
 *
 * EVERY action calls assertAdmin() — including ones that only read. Admin
 * status comes from `profiles.role` via the access module, never from a claim
 * or a hidden form field.
 *
 * All state changes go through grantEntitlement/revokeEntitlement, which write
 * their audit row in the SAME TRANSACTION as the change.
 */
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { assertAdmin } from '@/lib/auth/access'
import { grantEntitlement, revokeEntitlement } from '@/lib/payments/grant'
import { createAdminClient } from '@/lib/supabase/admin'

export type AdminActionState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; message: string }

const uuid = z.string().uuid()

export async function approveUserAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await assertAdmin()

  const userId = uuid.safeParse(formData.get('user_id'))
  const planId = uuid.safeParse(formData.get('plan_id'))
  if (!userId.success) return { status: 'error', message: 'Invalid user.' }
  if (!planId.success) return { status: 'error', message: 'Choose a plan.' }

  const rawDays = String(formData.get('duration_days') ?? '').trim()
  const durationDays = rawDays === '' ? null : Number.parseInt(rawDays, 10)
  if (durationDays !== null && (!Number.isFinite(durationDays) || durationDays <= 0)) {
    return { status: 'error', message: 'Duration must be a positive number of days, or blank for no expiry.' }
  }

  try {
    await grantEntitlement({
      userId: userId.data,
      planId: planId.data,
      durationDays,
      grantedBy: admin.userId,
      provider: 'manual',
      reason: 'Approved by admin',
    })
  } catch {
    return { status: 'error', message: 'Could not grant access. Please try again.' }
  }

  revalidatePath('/admin')
  return { status: 'success', message: 'Access granted.' }
}

export async function revokeUserAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await assertAdmin()

  const userId = uuid.safeParse(formData.get('user_id'))
  if (!userId.success) return { status: 'error', message: 'Invalid user.' }

  // An admin removing their own access would lock them out of this page.
  if (userId.data === admin.userId) {
    return { status: 'error', message: 'You cannot revoke your own access.' }
  }

  try {
    await revokeEntitlement(userId.data, admin.userId, 'Revoked by admin')
  } catch {
    return { status: 'error', message: 'Could not revoke access. Please try again.' }
  }

  revalidatePath('/admin')
  return { status: 'success', message: 'Access revoked.' }
}

export async function suspendUserAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await assertAdmin()

  const userId = uuid.safeParse(formData.get('user_id'))
  if (!userId.success) return { status: 'error', message: 'Invalid user.' }
  if (userId.data === admin.userId) {
    return { status: 'error', message: 'You cannot suspend yourself.' }
  }

  const suspend = formData.get('suspend') === 'true'
  const supabase = createAdminClient()

  const { data: before } = await supabase
    .from('profiles')
    .select('role, suspended_at')
    .eq('id', userId.data)
    .maybeSingle()

  const { error } = await supabase
    .from('profiles')
    .update({
      suspended_at: suspend ? new Date().toISOString() : null,
      suspended_reason: suspend ? 'Suspended by admin' : null,
      role: suspend ? 'suspended_user' : 'registered_user',
    })
    .eq('id', userId.data)

  if (error) return { status: 'error', message: 'Could not update that account.' }

  // Audit in the same flow as the change.
  await supabase.from('admin_audit_logs').insert({
    admin_id: admin.userId,
    action: suspend ? 'user.suspend' : 'user.unsuspend',
    target_type: 'profile',
    target_id: userId.data,
    target_user_id: userId.data,
    before_state: before ?? null,
    after_state: { suspended: suspend },
    reason: suspend ? 'Suspended by admin' : 'Unsuspended by admin',
  })

  revalidatePath('/admin')
  return { status: 'success', message: suspend ? 'Account suspended.' : 'Account restored.' }
}
