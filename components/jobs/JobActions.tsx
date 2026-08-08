'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'

import {
  getDownloadUrlAction,
  purgeJobAction,
  type JobActionState,
} from '@/lib/jobs/actions'

const INITIAL: JobActionState = { status: 'idle' }

function Pending({ label, busyLabel, primary }: { label: string; busyLabel: string; primary?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={
        primary
          ? 'rounded-[var(--radius-md)] bg-accent px-3.5 py-2 text-sm font-semibold text-cream transition-colors duration-150 hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-60'
          : 'rounded-[var(--radius-md)] border border-border px-3.5 py-2 text-sm font-medium text-muted transition-colors duration-150 hover:border-border-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-60'
      }
    >
      {pending ? busyLabel : label}
    </button>
  )
}

export function JobActions({
  jobId,
  hasExport,
  leadsRemaining,
}: {
  jobId: string
  hasExport: boolean
  leadsRemaining: number
}) {
  const [download, downloadAction] = useActionState(getDownloadUrlAction, INITIAL)
  const [purge, purgeAction] = useActionState(purgeJobAction, INITIAL)

  /**
   * Signed URLs expire in ~60s, so we trigger the download immediately rather
   * than rendering a link the user might click minutes later.
   */
  useEffect(() => {
    if (download.status === 'ready') {
      window.location.href = download.url
    }
  }, [download])

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {hasExport ? (
          <form action={downloadAction}>
            <input type="hidden" name="job_id" value={jobId} />
            <Pending label="Download CSV" busyLabel="Preparing…" primary />
          </form>
        ) : null}

        {leadsRemaining > 0 ? (
          <form action={purgeAction}>
            <input type="hidden" name="job_id" value={jobId} />
            <Pending label="Clear data" busyLabel="Clearing…" />
          </form>
        ) : null}
      </div>

      {download.status === 'error' ? (
        <p role="alert" className="text-sm text-danger">
          {download.message}
        </p>
      ) : null}

      {purge.status === 'error' ? (
        <p role="alert" className="text-sm text-danger">
          {purge.message}
        </p>
      ) : null}

      {purge.status === 'purged' ? (
        <p role="status" className="text-sm text-success">
          Cleared {purge.deleted.toLocaleString()} lead
          {purge.deleted === 1 ? '' : 's'} from the database. Your CSV is unaffected.
        </p>
      ) : null}

      {leadsRemaining === 0 && hasExport ? (
        <p className="text-sm text-muted">
          Lead data cleared — the CSV remains downloadable.
        </p>
      ) : null}
    </div>
  )
}
