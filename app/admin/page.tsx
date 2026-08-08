import type { Metadata } from 'next'

import { UserRow, type AdminUser } from '@/components/admin/UserRow'
import { requireAdmin } from '@/lib/auth/access'
import { listActivePlans } from '@/lib/limits/plans'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ProfileRow, UserRole } from '@/types/database'

export const metadata: Metadata = {
  title: 'Admin | Outlio',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  // Repeated deliberately — see the note in app/admin/layout.tsx.
  const ctx = await requireAdmin()
  const supabase = createAdminClient()

  const [{ data: profiles }, { data: requests }, { data: audit }, plans] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, email, full_name, phone, linkedin_url, role, plan_id, access_expires_at, suspended_at, created_at',
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('access_requests')
      .select('user_id, request_type, message, created_at')
      .eq('status', 'pending'),
    supabase
      .from('admin_audit_logs')
      .select('id, action, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(15),
    listActivePlans(),
  ])

  const planNames = new Map(plans.map((p) => [p.id, p.name]))
  const pendingByUser = new Map(
    (requests ?? []).map((r) => [
      r.user_id,
      { type: r.request_type, message: r.message, createdAt: r.created_at },
    ]),
  )

  const users: AdminUser[] = ((profiles ?? []) as ProfileRow[]).map((p) => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    phone: p.phone,
    linkedinUrl: p.linkedin_url,
    role: p.role as UserRole,
    planName: p.plan_id ? (planNames.get(p.plan_id) ?? null) : null,
    accessExpiresAt: p.access_expires_at,
    suspendedAt: p.suspended_at,
    createdAt: p.created_at,
    pendingRequest: pendingByUser.get(p.id) ?? null,
  }))

  const awaiting = users.filter((u) => u.pendingRequest)
  const others = users.filter((u) => !u.pendingRequest)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Users</h1>
        <p className="mt-1 text-sm text-muted">
          {users.length} account{users.length === 1 ? '' : 's'}
          {awaiting.length > 0 ? ` · ${awaiting.length} awaiting approval` : ''}
        </p>
      </div>

      {awaiting.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            Awaiting approval
          </h2>
          <ul className="space-y-3">
            {awaiting.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                plans={plans.map((p) => ({ id: p.id, name: p.name }))}
                isSelf={u.id === ctx.userId}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink">All accounts</h2>
        {others.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-panel p-8 text-center text-sm text-muted">
            No other accounts yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {others.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                plans={plans.map((p) => ({ id: p.id, name: p.name }))}
                isSelf={u.id === ctx.userId}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Recent activity</h2>
        <p className="text-sm text-muted">
          Audit log is append-only — entries can never be edited or deleted.
        </p>
        {(audit ?? []).length === 0 ? (
          <p className="text-sm text-muted">Nothing recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-[var(--radius-lg)] border border-border bg-panel">
            {(audit ?? []).map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 px-4 py-2.5">
                <code className="text-sm font-medium text-ink">{a.action}</code>
                <span className="min-w-0 flex-1 truncate text-sm text-muted">
                  {a.reason ?? ''}
                </span>
                <time dateTime={a.created_at} className="text-xs text-muted">
                  {new Date(a.created_at).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
