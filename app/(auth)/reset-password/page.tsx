import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { ResetPasswordForm } from './ResetPasswordForm'
import { AuthShell } from '@/components/auth/AuthShell'
import { getAccessContext } from '@/lib/auth/access'

export const metadata: Metadata = {
  title: 'Set a new password | Outlio',
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage() {
  // Reaching this page requires the session the reset link established.
  const ctx = await getAccessContext()
  if (!ctx.userId) redirect('/forgot-password?expired=1')

  return (
    <AuthShell title="Set a new password" subtitle="Choose something you haven't used elsewhere.">
      <ResetPasswordForm />
    </AuthShell>
  )
}
