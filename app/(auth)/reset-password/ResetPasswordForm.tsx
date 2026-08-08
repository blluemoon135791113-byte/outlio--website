'use client'

import { useActionState } from 'react'

import { Field } from '@/components/auth/Field'
import { FormFeedback } from '@/components/auth/FormFeedback'
import { SubmitButton } from '@/components/auth/SubmitButton'
import { updatePasswordAction, type ActionState } from '@/lib/auth/actions'
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password'

const INITIAL: ActionState = { status: 'idle' }

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, INITIAL)

  return (
    <form action={formAction} className="space-y-4">
      <FormFeedback state={state} />

      <Field
        id="password"
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
      />

      <Field
        id="confirm_password"
        name="confirm_password"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD_LENGTH}
      />

      <SubmitButton>Update password</SubmitButton>
    </form>
  )
}
