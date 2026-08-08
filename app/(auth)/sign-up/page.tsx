import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { SignUpForm } from './SignUpForm'
import { AuthShell } from '@/components/auth/AuthShell'
import { getAccessContext } from '@/lib/auth/access'

export const metadata: Metadata = {
  title: 'Create an account | Outlio',
  robots: { index: false, follow: false },
}

export default async function SignUpPage() {
  const ctx = await getAccessContext()
  if (ctx.userId) redirect('/dashboard')

  return (
    <AuthShell
      title="Create an account"
      subtitle="Access is approved manually. You'll be able to request it once your email is verified."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/sign-in" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  )
}
