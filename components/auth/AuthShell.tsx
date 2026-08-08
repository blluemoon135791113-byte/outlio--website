import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Unauthenticated page shell.
 *
 * Per docs/DESIGN_TOKENS.md §8, the hero aurora treatment is permitted HERE and
 * only here — sign-in, sign-up, verify-email, reset-password. Authenticated
 * dashboard surfaces use flat backgrounds so data stays legible.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-paper px-4 py-12">
      <div className="hero-aurora pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-8 block text-center text-sm font-semibold uppercase tracking-[0.22em] text-accent"
        >
          Outlio
        </Link>

        <div className="rounded-[var(--radius-xl)] border border-border bg-panel p-8 shadow-[var(--shadow-lg)]">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
          ) : null}

          <div className="mt-6">{children}</div>
        </div>

        {footer ? (
          <div className="mt-6 text-center text-sm text-muted">{footer}</div>
        ) : null}
      </div>
    </main>
  )
}
