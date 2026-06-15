'use client'

// Labelled form field — wires label/htmlFor + aria-describedby + role="alert"
// error the same way the login form does, via a render prop that hands the
// generated ids to the control. Keeps a11y wiring real, not cosmetic.
import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: (ids: { inputId: string; describedBy?: string }) => ReactNode
}

export function Field({ label, error, hint, required, className, children }: FieldProps) {
  const inputId = useId()
  const errorId = useId()
  const hintId = useId()
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
        {required && (
          <>
            <span className="text-brand-hot-red" aria-hidden="true">
              {' '}
              *
            </span>
            {/* Screen readers get the requirement in the field's name (the asterisk is decorative). */}
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      {children({ inputId, describedBy })}
      {hint && (
        <p id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-brand-hot-red text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
