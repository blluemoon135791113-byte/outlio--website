import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { SignInForm } from './SignInForm'
import { AuthShell } from '@/components/auth/AuthShell'
import { getAccessContext } from '@/lib/auth/access'

export const metadata: Metadata = {
  title: 'Sign in | Outlio',
  robots: { index: false, follow: false },
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const ctx = await getAccessContext()
  if (ctx.userId) redirect('/dashboard')

  const { next } = await searchParams

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your lead database."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="font-medium text-accent hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <SignInForm next={next} />
    </AuthShell>
  )
}
