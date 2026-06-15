// Public landing page — branded hero that routes into the gated app.
import Link from 'next/link'
import { RequestAccessButton } from '@/features/visitor-requests/components/request-access-button'

// Help / docs for logged-out visitors live in the nav menu and the floating widget
// (the public /brandhelperdocs.html), so the hero stays focused on the two primary CTAs.

export default function Home() {
  return (
    <main
      id="content"
      className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center"
    >
      <p className="text-muted-foreground font-mono text-xs tracking-[0.3em] uppercase">
        Creative Automation Pipeline
      </p>
      <h1 className="font-display text-5xl leading-[1.4] sm:text-7xl">
        <span className="gradient-text">Brand Helper</span>
      </h1>
      <p className="text-muted-foreground max-w-xl text-lg">
        Turn a campaign brief into on-brand, ready-to-post social creatives — generated, composited,
        and compliance-checked at scale.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="bg-brand-pink hover:bg-brand-pink/90 px-5 py-2.5 font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ borderRadius: 'var(--radius)' }}
        >
          Get started
        </Link>
        <RequestAccessButton variant="outline" size="lg" />
      </div>
    </main>
  )
}
