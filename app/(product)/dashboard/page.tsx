import type { Metadata } from 'next'
import Link from 'next/link'

import { requireAccess } from '@/lib/auth/access'

export const metadata: Metadata = {
  title: 'Dashboard | Outlio',
  robots: { index: false, follow: false },
}

/**
 * Overview. Phase 4 proves access control end to end; the real overview cards,
 * job history, and lead table arrive in Phase 9.
 */
export default async function DashboardPage() {
  const ctx = await requireAccess()

  const limits = ctx.plan?.limits
  const usage = ctx.usage

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          Signed in as {ctx.email}
          {ctx.plan ? ` · ${ctx.plan.name} plan` : ''}
        </p>
      </div>

      <section
        aria-label="Usage this period"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <UsageCard
          label="Extractions today"
          value={usage?.extractionsToday ?? 0}
          limit={limits?.extractions_per_day ?? null}
        />
        <UsageCard
          label="Extractions this month"
          value={usage?.extractionsThisMonth ?? 0}
          limit={limits?.extractions_per_month ?? null}
        />
        <UsageCard
          label="Records this month"
          value={usage?.recordsThisMonth ?? 0}
          limit={limits?.records_per_month ?? null}
        />
        <UsageCard
          label="Exports this month"
          value={usage?.exportsThisMonth ?? 0}
          limit={limits?.exports_per_month ?? null}
        />
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-panel p-6">
        <h2 className="text-base font-semibold text-ink">Start an extraction</h2>
        <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted">
          Upload the pages you saved from your lead search results. We parse them on
          our servers and give you a clean, de-duplicated CSV.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/extract/new"
            className="rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-semibold text-cream transition-colors duration-150 hover:bg-accent-deep"
          >
            New extraction
          </Link>
          <Link
            href="/dashboard/jobs"
            className="rounded-[var(--radius-md)] border border-border px-4 py-2 text-sm font-semibold text-ink transition-colors duration-150 hover:border-border-strong"
          >
            View past extractions
          </Link>
        </div>
      </section>
    </div>
  )
}

function UsageCard({
  label,
  value,
  limit,
}: {
  label: string
  value: number
  limit: number | null
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-panel p-4 shadow-[var(--shadow-sm)]">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
        {value.toLocaleString()}
        <span className="ml-1 text-sm font-medium text-muted">
          {limit === null ? '/ unlimited' : `/ ${limit.toLocaleString()}`}
        </span>
      </p>
    </div>
  )
}
