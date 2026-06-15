// Shown when the user has no campaigns yet — points at the brief intake.
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { SparklesIcon } from '@/components/icons'

export function EmptyState() {
  return (
    <div
      className="border-border flex flex-col items-center gap-3 border border-dashed p-10 text-center"
      style={{ borderRadius: 'var(--radius-lg)' }}
    >
      <SparklesIcon className="text-brand-cyan h-8 w-8" aria-hidden="true" />
      <h2 className="text-xl leading-[1.4] font-semibold">No campaigns yet</h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        Start with a campaign brief — we generate or reuse hero imagery and composite on-brand
        creatives in every ratio.
      </p>
      <Link
        href="/campaigns/new"
        className={buttonVariants()}
        style={{ borderRadius: 'var(--radius)' }}
      >
        New campaign
      </Link>
    </div>
  )
}
