'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/dashboard', label: 'Overview', exact: true },
  { href: '/dashboard/extract/new', label: 'New extraction' },
  { href: '/dashboard/jobs', label: 'Extractions' },
] as const

/**
 * Primary product navigation.
 *
 * `aria-current="page"` rather than colour alone — the active state must be
 * conveyed to assistive tech, not only visually.
 */
export function ProductNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  const links = isAdmin
    ? [...LINKS, { href: '/admin', label: 'Admin', exact: false } as const]
    : LINKS

  return (
    <nav aria-label="Product" className="flex items-center gap-1">
      {links.map((l) => {
        const active = isActive(l.href, 'exact' in l ? l.exact : false)
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={
              active
                ? 'rounded-[var(--radius-md)] bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent'
                : 'rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium text-muted transition-colors duration-150 hover:text-ink'
            }
          >
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
