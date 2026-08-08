'use client'

import { useActionState } from 'react'

import { Field } from '@/components/auth/Field'
import { FormFeedback } from '@/components/auth/FormFeedback'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { resendVerificationAction, type ActionState } from '@/lib/auth/actions'

const INITIAL: ActionState = { status: 'idle' }

export function ResendForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction] = useActionState(resendVerificationAction, INITIAL)

  return (
    <form action={formAction} className="space-y-4">
      <FormFeedback state={state} />

      <Field
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={defaultEmail}
        required
      />

      <SubmitButton>Resend verification link</SubmitButton>
    </form>
  )
}
