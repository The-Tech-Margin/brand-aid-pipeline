// Status badge — tone maps to a brand token (which collapses to gray on the plain
// skin). Includes helpers to map compliance/run statuses to a tone, and a StatusDot.
import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { ComplianceStatus, RunStatus } from '@/types/database'
import type { Severity } from '@/features/pipeline/legal/types'

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        success: 'bg-brand-lime/15 text-brand-lime',
        warn: 'bg-brand-goldenrod/15 text-brand-goldenrod',
        danger: 'bg-brand-hot-red/15 text-brand-hot-red',
        info: 'bg-brand-cyan/15 text-brand-cyan',
        muted: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { tone: 'muted' },
  },
)

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, style, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ tone }), className)}
      style={{ borderRadius: 'var(--radius)', ...style }}
      {...props}
    />
  )
}

export function StatusDot({ tone }: { tone: BadgeTone }) {
  const color: Record<BadgeTone, string> = {
    success: 'bg-brand-lime',
    warn: 'bg-brand-goldenrod',
    danger: 'bg-brand-hot-red',
    info: 'bg-brand-cyan',
    muted: 'bg-muted-foreground',
  }
  return (
    <span aria-hidden="true" className={cn('inline-block h-2 w-2 rounded-full', color[tone])} />
  )
}

export function toneForCompliance(status: ComplianceStatus): BadgeTone {
  return status === 'pass' ? 'success' : status === 'warn' ? 'warn' : 'danger'
}

export function toneForSeverity(severity: Severity): BadgeTone {
  return severity === 'fail' ? 'danger' : severity === 'warn' ? 'warn' : 'info'
}

export function toneForRun(status: RunStatus): BadgeTone {
  if (status === 'succeeded') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'running') return 'warn'
  return 'muted'
}
