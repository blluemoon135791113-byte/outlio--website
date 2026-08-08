'use server'

/**
 * Upload via SIGNED UPLOAD URLS.
 *
 * ⚠️ WHY NOT A SERVER ACTION BODY
 *
 * Server Actions cap the request body at 1 MB by default, and Vercel caps it at
 * ~4.5 MB no matter what `bodySizeLimit` says. This product advertises 100 files
 * at 10 MB each — up to 1 GB per batch. Sending file bytes through an action is
 * not a limit to raise, it is the wrong transport.
 *
 * Worse, it fails SILENTLY: Next truncates the oversized part and the action
 * receives a `File` named `blob` with zero bytes. That is exactly the bug this
 * module replaces.
 *
 * So: the server validates access and limits, creates the rows, and hands back
 * one short-lived signed upload URL per file. The browser PUTs bytes straight to
 * Supabase Storage. No file byte ever passes through a Server Action.
 *
 * CONTENT SNIFFING STILL HAPPENS SERVER-SIDE — it moves to the worker, which
 * already downloads each file before parsing. See lib/worker/process-job.ts.
 * Client-side checks here remain UX only and are never trusted.
 */
import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { z } from 'zod'

import { assertAccess } from '@/lib/auth/access'
import { isAppError } from '@/lib/errors/catalog'
import { resolveUploadLimits } from '@/lib/upload/limits'
import { STORAGE_BUCKET } from '@/lib/upload/process'
import { buildStorageKey, sanitizeDisplayFilename } from '@/lib/upload/storage-key'
import { createAdminClient } from '@/lib/supabase/admin'
import { claimAndProcessOne } from '@/lib/worker/process-job'

const DEDUPE_MODES = ['keep_all', 'remove_exact', 'remove_likely', 'review'] as const

/** Metadata only — no bytes. Deliberately small enough to never hit any limit. */
const fileDescriptorSchema = z.object({
  name: z.string().min(1).max(400),
  size: z.number().int().positive(),
})

const requestSchema = z.object({
  dedupeMode: z.enum(DEDUPE_MODES),
  files: z.array(fileDescriptorSchema).min(1).max(500),
})

export type UploadTicket = {
  fileId: string
  displayName: string
  path: string
  /** Supabase signed-upload token, consumed by `uploadToSignedUrl`. */
  token: string
}

export type CreateSessionResult =
  | { ok: true; jobId: string; bucket: string; tickets: UploadTicket[] }
  | { ok: false; message: string }

/**
 * Validates the request and issues one signed upload URL per file.
 *
 * Nothing here trusts the reported size — it is used only to reject obviously
 * oversized batches early and to give a clear message. The bucket enforces the
 * real per-file ceiling, and the worker verifies actual content.
 */
export async function createUploadSessionAction(input: {
  dedupeMode: string
  files: Array<{ name: string; size: number }>
}): Promise<CreateSessionResult> {
  let ctx
  try {
    // The ONLY access decision.
    ctx = await assertAccess()
  } catch (e) {
    return {
      ok: false,
      message: isAppError(e) ? e.userMessage : 'You do not have access to upload files.',
    }
  }

  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: 'That upload request was not valid.' }
  }

  const { dedupeMode, files } = parsed.data
  const limits = resolveUploadLimits(ctx.plan?.limits ?? null)

  if (files.length > limits.maxFiles) {
    return {
      ok: false,
      message: `You can upload up to ${limits.maxFiles} files at once on your plan.`,
    }
  }

  const tooBig = files.filter((f) => f.size > limits.maxFileBytes)
  if (tooBig.length > 0) {
    const mb = Math.round(limits.maxFileBytes / (1024 * 1024))
    return {
      ok: false,
      message: `${tooBig.length} file${tooBig.length === 1 ? ' is' : 's are'} over the ${mb} MB limit. Remove them and try again.`,
    }
  }

  const supabase = createAdminClient()
  const jobId = randomUUID()

  const { error: jobError } = await supabase.from('extraction_jobs').insert({
    id: jobId,
    // Service role bypasses RLS — this id comes from a verified session only.
    user_id: ctx.userId!,
    status: 'uploaded',
    dedupe_mode: dedupeMode,
    file_count: files.length,
    total_bytes: files.reduce((s, f) => s + f.size, 0),
    progress_step: 'Uploading files',
    progress_current: 0,
    progress_total: files.length,
  })

  if (jobError) {
    return { ok: false, message: "We couldn't start that upload. Please try again." }
  }

  const tickets: UploadTicket[] = []

  for (const file of files) {
    const fileId = randomUUID()
    // Server-generated. The user's filename never influences the path.
    const path = buildStorageKey(ctx.userId!, jobId, fileId)
    const displayName = sanitizeDisplayFilename(file.name)

    const { data: signed, error: signError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUploadUrl(path)

    if (signError || !signed) {
      await supabase.from('extraction_jobs').delete().eq('id', jobId)
      return { ok: false, message: "We couldn't prepare that upload. Please try again." }
    }

    const { error: rowError } = await supabase.from('uploaded_files').insert({
      id: fileId,
      user_id: ctx.userId!,
      extraction_job_id: jobId,
      original_filename: displayName,
      storage_path: path,
      byte_size: file.size,
      // Real hash is computed by the worker from actual bytes. This placeholder
      // is unique per file so the (user_id, content_sha256) index cannot
      // spuriously collide before we know the truth.
      content_sha256: fileId.replace(/-/g, '').padEnd(64, '0').slice(0, 64),
      status: 'pending',
    })

    if (rowError) {
      await supabase.from('extraction_jobs').delete().eq('id', jobId)
      return { ok: false, message: "We couldn't prepare that upload. Please try again." }
    }

    tickets.push({ fileId, displayName, path, token: signed.token })
  }

  return { ok: true, jobId, bucket: STORAGE_BUCKET, tickets }
}

export type FinalizeResult =
  | { ok: true; jobId: string; queued: number }
  | { ok: false; message: string }

/**
 * Marks the upload complete and enqueues the job.
 *
 * `failedFileIds` are files the browser could not upload; their rows are removed
 * so the worker does not try to download objects that were never written.
 */
export async function finalizeUploadAction(input: {
  jobId: string
  failedFileIds: string[]
}): Promise<FinalizeResult> {
  let ctx
  try {
    ctx = await assertAccess()
  } catch (e) {
    return {
      ok: false,
      message: isAppError(e) ? e.userMessage : 'You do not have access to upload files.',
    }
  }

  const jobId = z.string().uuid().safeParse(input.jobId)
  if (!jobId.success) return { ok: false, message: 'That upload could not be finalised.' }

  const supabase = createAdminClient()

  // Ownership check — the job id came from the client.
  const { data: job } = await supabase
    .from('extraction_jobs')
    .select('id')
    .eq('id', jobId.data)
    .eq('user_id', ctx.userId!)
    .maybeSingle()

  if (!job) return { ok: false, message: 'That upload could not be finalised.' }

  const failed = z.array(z.string().uuid()).safeParse(input.failedFileIds)
  if (failed.success && failed.data.length > 0) {
    await supabase
      .from('uploaded_files')
      .delete()
      .eq('extraction_job_id', jobId.data)
      .eq('user_id', ctx.userId!)
      .in('id', failed.data)
  }

  const { data: remaining } = await supabase
    .from('uploaded_files')
    .select('id')
    .eq('extraction_job_id', jobId.data)
    .eq('user_id', ctx.userId!)

  const queued = remaining?.length ?? 0

  if (queued === 0) {
    await supabase
      .from('extraction_jobs')
      .update({
        status: 'failed',
        error_code: 'ERR_STORAGE',
        error_message: 'No files were uploaded successfully.',
      })
      .eq('id', jobId.data)
    return { ok: false, message: 'None of those files finished uploading. Please try again.' }
  }

  await supabase
    .from('extraction_jobs')
    .update({ file_count: queued, progress_total: queued })
    .eq('id', jobId.data)

  /*
   * Spend the extraction credit BEFORE enqueuing.
   *
   * consume_credit is an atomic check-and-spend that rolls itself back when the
   * balance is insufficient, so two concurrent uploads cannot both take the last
   * credit. Charging here rather than in the worker means the user is told
   * immediately, and a job is never queued that they cannot pay for.
   */
  const { data: creditsRaw } = await supabase.rpc('consume_credit', {
    p_user_id: ctx.userId!,
    p_amount: 1,
  })
  const creditsLeft = typeof creditsRaw === 'number' ? creditsRaw : -1

  if (creditsLeft < 0) {
    await supabase
      .from('extraction_jobs')
      .update({
        status: 'failed',
        error_code: 'ERR_LIMIT_REACHED',
        error_message: 'Not enough credits.',
      })
      .eq('id', jobId.data)

    return {
      ok: false,
      message:
        "You're out of credits for this month. Upgrade your plan or wait for the reset.",
    }
  }

  await supabase.rpc('increment_usage', {
    p_user_id: ctx.userId!,
    p_metric: 'files',
    p_period_start: ctx.usage!.monthPeriod.start.toISOString(),
    p_period_end: ctx.usage!.monthPeriod.end.toISOString(),
    p_by: queued,
  })

  // Durable record first: even if the after() work never runs, the job is
  // recoverable by the reaper.
  await supabase.rpc('enqueue_job', { p_job_id: jobId.data })

  after(async () => {
    try {
      await claimAndProcessOne(`after:${jobId.data}`)
    } catch {
      // Recovery is reap_stale_jobs()'s job.
    }
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/jobs')

  return { ok: true, jobId: jobId.data, queued }
}
