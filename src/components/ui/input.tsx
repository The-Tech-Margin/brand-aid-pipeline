// Text input + textarea primitives — shared border/radius/focus tokens so every
// form control looks identical across both themes. Presentational, ref-forwarding.
import type { InputHTMLAttributes, Ref, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const fieldClasses =
  'border-border bg-card w-full border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>
}

export function Input({ className, style, ref, ...props }: InputProps) {
  return (
    <input
      ref={ref}
      className={cn(fieldClasses, className)}
      style={{ borderRadius: 'var(--radius)', ...style }}
      {...props}
    />
  )
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: Ref<HTMLTextAreaElement>
}

export function Textarea({ className, style, ref, ...props }: TextareaProps) {
  return (
    <textarea
      ref={ref}
      className={cn(fieldClasses, 'min-h-24 font-mono', className)}
      style={{ borderRadius: 'var(--radius)', ...style }}
      {...props}
    />
  )
}
