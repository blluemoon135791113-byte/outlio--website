'use client'

import { useActionState } from 'react'

import { Field } from '@/components/auth/Field'
import { FormFeedback } from '@/components/auth/FormFeedback'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { requestPasswordResetAction, type ActionState } from '@/lib/auth/actions'

const INITIAL: ActionState = { status: 'idle' }

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, INITIAL)

  return (
    <form action={formAction} className="space-y-4">
      <FormFeedback state={state} />

      <Field
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
      />

      <SubmitButton>Send reset link</SubmitButton>
    </form>
  )
}
