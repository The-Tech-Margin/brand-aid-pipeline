// Presentational list of validation errors, announced via role="alert". Focusable
// (tabIndex -1) so the form can move focus here on a failed submit.
import type { Ref } from 'react'

interface BriefErrorsProps {
  errors: string[]
  ref?: Ref<HTMLDivElement>
}

export function BriefErrors({ errors, ref }: BriefErrorsProps) {
  if (errors.length === 0) return null
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="border-brand-hot-red/40 bg-brand-hot-red/10 border p-3 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      style={{ borderRadius: 'var(--radius)' }}
    >
      <p className="text-brand-hot-red text-sm font-medium">Please fix the following:</p>
      <ul className="text-brand-hot-red mt-1 list-inside list-disc text-sm">
        {errors.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    </div>
  )
}
