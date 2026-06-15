// New campaign — brief intake (form or JSON/YAML). Auth is enforced by the (app)
// layout guard; this server shell just frames the client intake component.
import Link from 'next/link'
import { BriefIntake } from '@/features/brief/components/brief-intake'
import { EXAMPLES, getExample } from '@/features/brief/examples'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ example?: string }>
}) {
  const { example } = await searchParams
  const prefill = getExample(example)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard" className="text-muted-foreground text-sm hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-3xl leading-[1.4] font-semibold">
          <span className="gradient-text">New campaign</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Describe the campaign or paste a JSON/YAML brief. We reuse your uploaded assets where
          present and generate the rest with your selected image model.
        </p>
      </div>
      <div
        className="border-border bg-muted/30 flex flex-wrap items-center gap-2 border p-3"
        style={{ borderRadius: 'var(--radius)' }}
      >
        <span className="text-muted-foreground text-sm font-medium">Try an example:</span>
        {EXAMPLES.map((ex) => (
          <Link
            key={ex.slug}
            href={`/campaigns/new?example=${ex.slug}`}
            aria-current={prefill?.slug === ex.slug ? 'true' : undefined}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              prefill?.slug === ex.slug && 'border-brand-cyan text-brand-cyan',
            )}
            style={{ borderRadius: 'var(--radius)' }}
          >
            {ex.title}
          </Link>
        ))}
        {prefill && (
          <Link
            href="/campaigns/new"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            style={{ borderRadius: 'var(--radius)' }}
          >
            Clear
          </Link>
        )}
      </div>

      {prefill && (
        <p
          role="status"
          className="border-border bg-muted/40 text-muted-foreground border px-3 py-2 text-sm"
          style={{ borderRadius: 'var(--radius)' }}
        >
          Prefilled from the <strong className="text-foreground">{prefill.title}</strong> example —
          review the fields and click Generate.
        </p>
      )}
      {/* key remounts the intake so an in-page example switch reinitializes the form. */}
      <BriefIntake key={prefill?.slug ?? 'blank'} initialBrief={prefill?.brief} />
    </div>
  )
}
