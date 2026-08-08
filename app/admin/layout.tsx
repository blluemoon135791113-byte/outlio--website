import Link from 'next/link'
import type { ReactNode } from 'react'

import { signOutAction } from '@/lib/auth/actions'
import { requireAdmin } from '@/lib/auth/access'

/**
 * Admin shell.
 *
 * `requireAdmin()` here guards the whole segment, but every page and action
 * below ALSO calls it. A layout is not an authorization boundary — Next can
 * render a route without re-running a parent layout in some navigation paths,
 * and Server Actions do not pass through layouts at all.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const ctx = await requireAdmin()

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-border bg-panel">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-semibold uppercase tracking-[0.22em] text-accent"
            >
              Outlio
            </Link>
            <span className="rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted transition-colors duration-150 hover:text-ink"
            >
              Back to app
            </Link>
            <span className="hidden text-sm text-muted sm:inline">{ctx.email}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-sm font-medium text-ink transition-colors duration-150 hover:border-border-strong"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  )
}
