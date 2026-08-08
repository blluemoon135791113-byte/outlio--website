import type { ActionState } from '@/lib/auth/actions'

/**
 * Error and success banners. Uses the status tokens added in globals.css —
 * no hardcoded colors.
 *
 * role="alert" so screen readers announce the result without a focus jump.
 */
export function FormFeedback({ state }: { state: ActionState }) {
  if (state.status === 'idle') return null

  const isError = state.status === 'error'

  return (
    <div
      role="alert"
      className={
        isError
          ? 'rounded-[var(--radius-md)] border border-danger/25 bg-danger-soft px-3 py-2.5 text-sm leading-relaxed text-danger'
          : 'rounded-[var(--radius-md)] border border-success/25 bg-success-soft px-3 py-2.5 text-sm leading-relaxed text-success'
      }
    >
      {state.message}
    </div>
  )
}
