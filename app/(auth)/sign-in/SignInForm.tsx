'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { Field } from '@/components/auth/Field'
import { FormFeedback } from '@/components/auth/FormFeedback'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { signInAction, type ActionState } from '@/lib/auth/actions'

const INITIAL: ActionState = { status: 'idle' }

export function SignInForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(signInAction, INITIAL)

  // React 19 clears uncontrolled fields after a form action; restore the email
  // so a wrong password does not also mean retyping the address.
  const priorEmail = state.status === 'error' ? (state.values?.email ?? '') : ''

  return (
    <form action={formAction} className="space-y-4">
      <FormFeedback state={state} />

      {next ? <input type="hidden" name="next" value={next} /> : null}

      <Field
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        defaultValue={priorEmail}
      />

      <div className="space-y-1.5">
        <Field
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
        />
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-accent hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <SubmitButton>Sign in</SubmitButton>
    </form>
  )
}
