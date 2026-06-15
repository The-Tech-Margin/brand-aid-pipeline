// Card surface — bg-card + border + token radius. Presentational, server-safe.
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-border bg-card border p-4', className)}
      style={{ borderRadius: 'var(--radius)', ...style }}
      {...props}
    />
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-sm font-semibold', className)} {...props}>
      {children}
    </h2>
  )
}
