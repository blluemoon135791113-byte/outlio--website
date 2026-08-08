'use server'

/**
 * Job actions: download the CSV, purge the data, retry a stalled job.
 */
import { revalidatePath } from 'next/cache'

import { assertUser } from '@/lib/auth/access'
import { keyBelongsToUser } from '@/lib/upload/storage-key'
import { createAdminClient } from '@/lib/supabase/admin'

const SIGNED_URL_TTL = Number.parseInt(process.env.SIGNED_URL_TTL_SECONDS ?? '60', 10)

/** Exports live in their own private bucket — see lib/worker/process-job.ts. */
const EXPORT_BUCKET = process.env.SUPABASE_EXPORT_BUCKET ?? 'exports'

export type JobActionState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ready'; url: string }
  | { status: 'purged'; deleted: number }

/**
 * Issues a short-lived signed URL for a job's CSV.
 *
 * Ownership is re-verified against the session on every call — never trusted
 * from the form — and the stored path is checked to sit inside the caller's
 * prefix before signing.
 */
export async function getDownloadUrlAction(
  _prev: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const ctx = await assertUser()
  const jobId = String(formData.get('job_id') ?? '')
  if (!jobId) return { status: 'error', message: 'Missing job.' }

  const supabase = createAdminClient()

  const { data: job } = await supabase
    .from('extraction_jobs')
    .select('id, export_storage_path, status')
    // Service role bypasses RLS — this scoping IS the authorization.
    .eq('id', jobId)
    .eq('user_id', ctx.userId!)
    .maybeSingle()

  if (!job?.export_storage_path) {
    return { status: 'error', message: 'That export is not ready yet.' }
  }

  // Defence in depth: the path must be inside this user's prefix.
  if (!keyBelongsToUser(job.export_storage_path, ctx.userId!)) {
    return { status: 'error', message: 'That export is not available.' }
  }

  /*
   * Spend the export credit.
   *
   * Charged once per DOWNLOAD, per the pricing model. Deliberately charged
   * before signing, so a failure to pay never yields a usable URL. Admins are
   * exempt inside consume_credit.
   */
  const { data: remainingRaw } = await supabase.rpc('consume_credit', {
    p_user_id: ctx.userId!,
    p_amount: 1,
  })

  if (typeof remainingRaw === 'number' && remainingRaw < 0) {
    return {
      status: 'error',
      message:
        "You're out of credits for this month. Upgrade your plan or wait for the reset.",
    }
  }

  const { data: signed, error } = await supabase.storage
    .from(EXPORT_BUCKET)
    .createSignedUrl(job.export_storage_path, SIGNED_URL_TTL, {
      download: `outlio-leads-${jobId.slice(0, 8)}.csv`,
    })

  if (error || !signed?.signedUrl) {
    return { status: 'error', message: "We couldn't build your export. Please try again." }
  }

  // Signed URLs are never logged (CLAUDE.md).
  return { status: 'ready', url: signed.signedUrl }
}

/**
 * Purges a job's lead rows once the user has their CSV.
 *
 * The dedupe keys survive in `lead_keys`, so duplicate detection across future
 * uploads still works while the personal data genuinely disappears.
 */
export async function purgeJobAction(
  _prev: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const ctx = await assertUser()
  const jobId = String(formData.get('job_id') ?? '')
  if (!jobId) return { status: 'error', message: 'Missing job.' }

  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('purge_job_leads', {
    p_job_id: jobId,
    p_user_id: ctx.userId!,
  })

  if (error) {
    return { status: 'error', message: "We couldn't clear that data. Please try again." }
  }

  revalidatePath('/dashboard/jobs')
  return { status: 'purged', deleted: typeof data === 'number' ? data : 0 }
}
