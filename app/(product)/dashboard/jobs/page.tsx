import type { Metadata } from 'next'
import Link from 'next/link'

import { JobActions } from '@/components/jobs/JobActions'
import { requireAccess } from '@/lib/auth/access'
import { createAdminClient } from '@/lib/supabase/admin'
import type { JobStatus } from '@/types/database'

export const metadata: Metadata = {
  title: 'Extractions | Outlio',
  robots: { index: false, follow: false },
}

// Jobs progress in the background, so this must not be cached.
export const dynamic = 'force-dynamic'

export default async function JobsPage() {
  const ctx = await requireAccess()
  const supabase = createAdminClient()

  /*
   * Recover stalled jobs on every visit to this page.
   *
   * Without an always-on worker, a Vercel function timeout can cut short the
   * `after()` run and leave a job 'claimed' forever. Viewing the jobs list is
   * the natural moment to sweep: it is exactly when a stuck job matters to
   * someone. Cheap (one indexed UPDATE), idempotent, and it means we need no
   * cron on the free tier.
   *
   * Failures are ignored — a reaper that cannot run must not break the page.
   */
  try {
    await Promise.all([
      // Jobs a worker claimed then died mid-run.
      supabase.rpc('reap_stale_jobs', { p_timeout_seconds: 900 }),
      // Jobs created but never enqueued — the browser closed between issuing
      // signed upload URLs and finalising. Invisible to the stale-claim reaper
      // because they were never claimed.
      supabase.rpc('reap_orphaned_uploads', { p_older_than_minutes: 10 }),
    ])
  } catch {
    // Non-fatal: a reaper that cannot run must not break the page.
  }

  const { data: jobs } = await supabase
    .from('extraction_jobs')
    // Must be ONE string literal — Supabase infers the row type from it, and a
    // concatenated expression degrades to GenericStringError.
    .select(
      'id, status, progress_step, progress_current, progress_total, file_count, leads_parsed, leads_kept, duplicates_removed, export_storage_path, error_message, created_at',
    )
    // Service role bypasses RLS — this scoping IS the authorization.
    .eq('user_id', ctx.userId!)
    .order('created_at', { ascending: false })
    .limit(50)

  const rows = jobs ?? []

  // How many lead rows survive per job, so "Clear data" only shows when useful.
  const remaining = new Map<string, number>()
  if (rows.length > 0) {
    const { data: leads } = await supabase
      .from('extracted_leads')
      .select('extraction_job_id')
      .eq('user_id', ctx.userId!)
      .in('extraction_job_id', rows.map((j) => j.id))

    for (const l of leads ?? []) {
      remaining.set(l.extraction_job_id, (remaining.get(l.extraction_job_id) ?? 0) + 1)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Extractions</h1>
          <p className="mt-1 text-sm text-muted">
            Download your leads as CSV. Clear the data when you&apos;re done with it.
          </p>
        </div>
        <Link
          href="/dashboard/extract/new"
          className="rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-semibold text-cream transition-colors duration-150 hover:bg-accent-deep"
        >
          New extraction
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3">
          {rows.map((job) => (
            <li
              key={job.id}
              className="rounded-[var(--radius-lg)] border border-border bg-panel p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={job.status} />
                    <time
                      dateTime={job.created_at}
                      className="text-sm text-muted"
                      suppressHydrationWarning
                    >
                      {new Date(job.created_at).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>

                  <p className="mt-2 text-sm text-ink">
                    {job.file_count} file{job.file_count === 1 ? '' : 's'}
                    {job.leads_kept > 0 ? (
                      <>
                        {' · '}
                        <span className="font-medium">
                          {job.leads_kept.toLocaleString()} leads
                        </span>
                      </>
                    ) : null}
                    {job.duplicates_removed > 0 ? (
                      <>{` · ${job.duplicates_removed} duplicate${job.duplicates_removed === 1 ? '' : 's'} removed`}</>
                    ) : null}
                  </p>

                  {job.status === 'processing' || job.status === 'queued' ? (
                    <p className="mt-1 text-sm text-muted">
                      {job.progress_step ?? 'Working…'}
                      {job.progress_total > 0
                        ? ` (${job.progress_current}/${job.progress_total})`
                        : ''}
                    </p>
                  ) : null}

                  {job.error_message ? (
                    <p className="mt-1 text-sm text-danger">{job.error_message}</p>
                  ) : null}
                </div>

                <JobActions
                  jobId={job.id}
                  hasExport={Boolean(job.export_storage_path)}
                  leadsRemaining={remaining.get(job.id) ?? 0}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {rows.some((j) => j.status === 'queued' || j.status === 'processing') ? (
        <p className="text-sm text-muted">
          Processing runs in the background — you can close this page and come back.
          Refresh to see progress.
        </p>
      ) : null}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-panel p-10 text-center">
      <h2 className="text-base font-semibold text-ink">No extractions yet</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted">
        Upload the pages you saved from your lead search results and we&apos;ll turn
        them into a clean, de-duplicated CSV.
      </p>
      <Link
        href="/dashboard/extract/new"
        className="mt-5 inline-block rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-semibold text-cream transition-colors duration-150 hover:bg-accent-deep"
      >
        Start your first extraction
      </Link>
    </div>
  )
}

function StatusBadge({ status }: { status: JobStatus }) {
  const map: Record<JobStatus, { label: string; className: string }> = {
    uploaded: { label: 'Uploaded', className: 'bg-info-soft text-info border-info/25' },
    queued: { label: 'Queued', className: 'bg-info-soft text-info border-info/25' },
    processing: { label: 'Processing', className: 'bg-info-soft text-info border-info/25' },
    completed: { label: 'Completed', className: 'bg-success-soft text-success border-success/25' },
    partially_completed: {
      label: 'Completed with errors',
      className: 'bg-warning-soft text-warning border-warning/25',
    },
    failed: { label: 'Failed', className: 'bg-danger-soft text-danger border-danger/25' },
    cancelled: { label: 'Cancelled', className: 'bg-danger-soft text-danger border-danger/25' },
  }
  const { label, className } = map[status]

  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  )
}
