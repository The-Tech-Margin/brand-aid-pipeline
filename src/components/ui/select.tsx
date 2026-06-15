// Styled native <select> — keeps full keyboard/native a11y, themed to tokens with
// a custom chevron. Native is the right call for simple option lists.
import type { Ref, SelectHTMLAttributes } from 'react'
import { ChevronDownIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  ref?: Ref<HTMLSelectElement>
}

export function Select({ className, style, children, ref, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'border-border bg-card w-full appearance-none border px-3 py-2 pr-9 text-sm focus-visible:ring-2 focus-visible:ring-offset-2',
          className,
        )}
        style={{ borderRadius: 'var(--radius)', ...style }}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2"
        aria-hidden="true"
      />
    </div>
  )
}
