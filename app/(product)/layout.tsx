import Link from 'next/link'
import type { ReactNode } from 'react'

import { ProductNav } from '@/components/product/ProductNav'
import { signOutAction } from '@/lib/auth/actions'
import { requireUser } from '@/lib/auth/access'

/**
 * Authenticated shell.
 *
 * Flat `--paper` background per docs/DESIGN_TOKENS.md §8 — the hero
 * aurora/gradient treatment belongs only on unauthenticated pages.
 * No entrance animations here.
 *
 * This layout guarantees a signed-in user. It does NOT guarantee access —
 * individual pages call requireAccess(), so /dashboard/access can render for
 * users who are pending, expired, or suspended.
 */
export default async function ProductLayout({ children }: { children: ReactNode }) {
  const ctx = await requireUser()

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
            {/* Only users with access get product nav; everyone else is headed
                to /dashboard/access and would just hit redirects. */}
            {ctx.canUseScraper ? <ProductNav isAdmin={ctx.isAdmin} /> : null}
          </div>

          <div className="flex items-center gap-3">
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
