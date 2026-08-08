import type { InputHTMLAttributes } from 'react'

/**
 * Labelled input. Real <label for>, visible focus ring inherited from
 * :focus-visible in globals.css, and hint text wired via aria-describedby.
 */
export function Field({
  label,
  id,
  hint,
  ...props
}: { label: string; id: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const hintId = hint ? `${id}-hint` : undefined

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hintId}
        className="w-full rounded-[var(--radius-md)] border border-border bg-paper px-3 py-2 text-base text-ink transition-colors duration-150 placeholder:text-muted/70 hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-60"
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
