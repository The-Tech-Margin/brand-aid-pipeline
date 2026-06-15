// In-app help guide for the creative pipeline. Branded, anchor-linked TOC; the
// "Try it" cards prefill /campaigns/new with a shipped example brief so readers
// run the real flow. Server component — static content + links, no client JS.
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { EXAMPLES } from '@/features/brief/examples'
import { stringify as stringifyYaml } from 'yaml'

export const metadata = {
  title: 'Help — How to use the creative pipelines · Brand Helper',
}

const SECTIONS = [
  { id: 'how-it-works', label: 'How it works' },
  { id: 'quick-start', label: 'Quick start' },
  { id: 'anatomy', label: 'Anatomy of a brief' },
  { id: 'try-it', label: 'Try it' },
  { id: 'run-report', label: 'Run report' },
  { id: 'browsing', label: 'Browsing & export' },
  { id: 'keyboard', label: 'Keyboard & accessibility' },
  { id: 'requesting-access', label: 'Requesting access' },
  { id: 'faq', label: 'FAQ' },
] as const

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="border-border bg-muted text-foreground rounded-[var(--radius)] border px-1.5 py-0.5 text-xs">
      {children}
    </kbd>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-3 text-2xl leading-[1.4] font-semibold">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="border-border bg-card border p-4" style={{ borderRadius: 'var(--radius)' }}>
      {children}
    </div>
  )
}

function CodeBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col gap-1">
      <figcaption className="text-muted-foreground text-xs font-medium">{label}</figcaption>
      <pre
        className="border-border bg-card overflow-x-auto border p-3 font-mono text-xs leading-relaxed"
        style={{ borderRadius: 'var(--radius)' }}
      >
        {children}
      </pre>
    </figure>
  )
}

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/dashboard" className="text-muted-foreground text-sm hover:underline">
          <span aria-hidden="true">←</span> Dashboard
        </Link>
        <h1 className="mt-1 text-3xl leading-[1.4] font-semibold">
          <span className="gradient-text">How to use the creative pipelines</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          From a campaign brief to on-brand creatives in three aspect ratios — reuse what you have,
          generate the rest.
        </p>
      </div>

      <nav aria-label="On this page" className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="border-border hover:border-brand-cyan text-muted-foreground hover:text-foreground border px-3 py-1 text-sm transition-colors"
            style={{ borderRadius: 'var(--radius)' }}
          >
            {s.label}
          </a>
        ))}
      </nav>

      <Section id="how-it-works" title="How it works">
        <p className="text-muted-foreground">
          A campaign brief drives the whole pipeline. For each product, Brand Helper either{' '}
          <strong className="text-foreground">reuses</strong> a hero image you uploaded or{' '}
          <strong className="text-foreground">generates</strong> one with your selected image model
          (via the Vercel AI Gateway) — then composites every aspect ratio from that single master.
        </p>
        <ol className="text-muted-foreground ml-5 flex list-decimal flex-col gap-1.5">
          <li>Submit a brief (structured form, or paste/upload JSON or YAML).</li>
          <li>
            Per product: reuse an uploaded asset, or generate a hero with the selected image model.
          </li>
          <li>
            Composite <strong className="text-foreground">1:1, 9:16, and 16:9</strong> with a
            message overlay (localized when a <code>locale</code> is set), a contrast scrim, and
            brand framing.
          </li>
          <li>
            Run <strong className="text-foreground">compliance</strong> (logo, color, WCAG contrast)
            and <strong className="text-foreground">legal</strong> (prohibited-term) checks.
          </li>
          <li>Persist everything to Supabase — browse by product → ratio, or export a ZIP.</li>
        </ol>
      </Section>

      <Section id="quick-start" title="Quick start">
        <ol className="text-muted-foreground ml-5 flex list-decimal flex-col gap-1.5">
          <li>
            From the{' '}
            <Link href="/dashboard" className="text-brand-cyan hover:underline">
              dashboard
            </Link>
            , choose <strong className="text-foreground">New campaign</strong>.
          </li>
          <li>Fill the form, or switch to Paste / Upload for a JSON/YAML brief.</li>
          <li>
            Pick a run mode (Auto is recommended) and click{' '}
            <strong className="text-foreground">Generate</strong>.
          </li>
          <li>Watch the live run report; then open the creative browser to review and export.</li>
        </ol>
        <p className="text-muted-foreground">
          New here? Jump to{' '}
          <a href="#try-it" className="text-brand-cyan hover:underline">
            Try it
          </a>{' '}
          to load a ready-made example.
        </p>
      </Section>

      <Section id="anatomy" title="Anatomy of a brief">
        <p className="text-muted-foreground">Every brief has these fields:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs">
                <th className="py-1 pr-4 font-medium">Field</th>
                <th className="py-1 font-medium">What it does</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ['campaign_name', 'Names the campaign.'],
                [
                  'products[]',
                  'Each has name, description, and input_assets (filenames to reuse).',
                ],
                [
                  'input_assets',
                  'Filenames present → reuse that hero; empty → generate with the image model.',
                ],
                ['target_region / target_audience', 'Steer the generation prompt and tone.'],
                ['campaign_message', 'Overlaid on every creative.'],
                ['locale', 'Optional — adds a localized translation of the message.'],
                ['brand_palette', 'Optional hex colors for brand framing.'],
                ['aspect_ratios', 'Defaults to 1:1, 9:16, 16:9.'],
              ].map(([field, desc]) => (
                <tr key={field} className="border-border border-t">
                  <td className="py-1.5 pr-4">
                    <code className="text-foreground">{field}</code>
                  </td>
                  <td className="py-1.5">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground">
          A brief can be JSON or YAML — paste or upload either. Here is the{' '}
          <strong className="text-foreground">Summer Glow</strong> example in both formats:
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <CodeBlock label="JSON">{JSON.stringify(EXAMPLES[0]!.brief, null, 2)}</CodeBlock>
          <CodeBlock label="YAML">{stringifyYaml(EXAMPLES[0]!.brief)}</CodeBlock>
        </div>
      </Section>

      <Section id="try-it" title="Try it">
        <p className="text-muted-foreground">
          Load a ready-made example into the campaign form, review the fields, and click Generate.
          Each example pairs a <strong className="text-foreground">reused</strong> product with a{' '}
          <strong className="text-foreground">generated</strong> one so you can see both paths.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {EXAMPLES.map((ex) => (
            <Card key={ex.slug}>
              <h3 className="text-foreground mb-1 font-semibold">{ex.title}</h3>
              <div className="mb-2 flex flex-wrap gap-1.5">
                <Badge tone="info">{ex.brief.products.length} products</Badge>
                {ex.brief.locale && <Badge tone="muted">{ex.brief.locale}</Badge>}
                <Badge tone="success">reuse + generate</Badge>
              </div>
              <p className="text-muted-foreground mb-2 text-sm">{ex.summary}</p>
              <p className="text-muted-foreground mb-3 text-xs">{ex.reuseNote}</p>
              <Link
                href={`/campaigns/new?example=${ex.slug}`}
                className={buttonVariants({ size: 'sm' })}
                style={{ borderRadius: 'var(--radius)' }}
              >
                Load into the campaign form <span aria-hidden="true">→</span>
              </Link>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="run-report" title="Reading the run report">
        <p className="text-muted-foreground">
          After you Generate, the run report streams live progress and lands you on{' '}
          <code>/runs/&lt;id&gt;</code>:
        </p>
        <ul className="text-muted-foreground ml-5 flex list-disc flex-col gap-1.5">
          <li>Per-product progress: reused vs generated, and each ratio as it composites.</li>
          <li>
            <strong className="text-foreground">Compliance</strong> panel: logo presence, brand
            color, and WCAG contrast — pass / warn / fail.
          </li>
          <li>
            <strong className="text-foreground">Legal</strong> scan: flags risky claims (e.g.
            &ldquo;clinically proven&rdquo;, &ldquo;guaranteed&rdquo;).
          </li>
          <li>Export the report as JSON or Markdown.</li>
        </ul>
      </Section>

      <Section id="browsing" title="Browsing & exporting creatives">
        <ul className="text-muted-foreground ml-5 flex list-disc flex-col gap-1.5">
          <li>Browse creatives by product → ratio; open the lightbox for a full-size preview.</li>
          <li>
            Download a ZIP that mirrors{' '}
            <code>creatives/&#123;product&#125;/&#123;ratio&#125;/&hellip;</code>, plus a{' '}
            <code>deliverables/</code> folder of branded PDFs and social assets.
          </li>
          <li>
            Use <strong className="text-foreground">Edit in editor</strong> on a creative to add
            on-brand text and the logo, run AI ops (remove background, generative replace), and save
            the result back as a new variant — or start a blank{' '}
            <strong className="text-foreground">New design</strong>.
          </li>
          <li>
            Download branded deliverables: the campaign PDF, brand style sheet, per-creative spec
            sheets, and platform-sized social assets.
          </li>
        </ul>
      </Section>

      <Section id="keyboard" title="Keyboard & accessibility">
        <p className="text-muted-foreground">
          Brand Helper targets <strong className="text-foreground">WCAG 2.1 AA</strong> and is built
          to run from the keyboard. Every control shows a visible focus ring, dialogs trap focus and
          close on <Kbd>Esc</Kbd>, controls carry screen-reader labels, and animation respects your
          reduced-motion setting.
        </p>
        <h3 className="text-foreground mt-1 font-medium">Shortcuts</h3>
        <ul className="text-muted-foreground ml-5 flex list-disc flex-col gap-1.5">
          <li>
            <Kbd>⌘K</Kbd> / <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd> or <Kbd>?</Kbd> — open quick actions &amp;
            help (the floating button, bottom-right); type to search and jump anywhere.
          </li>
          <li>
            <Kbd>Esc</Kbd> — close the menu, the command palette, or any dialog.
          </li>
          <li>
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> then <Kbd>Enter</Kbd> — move and choose in the menu, the
            command palette, and the creative grid (<Kbd>Enter</Kbd>/<Kbd>Space</Kbd> opens a
            creative).
          </li>
          <li>
            <Kbd>Tab</Kbd> moves between controls; the{' '}
            <strong className="text-foreground">Skip to content</strong> link is the first thing it
            reaches on every page.
          </li>
        </ul>
        <h3 className="text-foreground mt-1 font-medium">In the editor</h3>
        <ul className="text-muted-foreground ml-5 flex list-disc flex-col gap-1.5">
          <li>
            Add text or your logo, then pick it from the{' '}
            <strong className="text-foreground">Elements</strong> row.
          </li>
          <li>
            Arrow keys move the selected element; <Kbd>Shift</Kbd>+arrow moves further;{' '}
            <Kbd>Delete</Kbd> removes it; <Kbd>Enter</Kbd> edits text.
          </li>
          <li>Resizing and rotating currently need a mouse or touch.</li>
        </ul>
      </Section>

      <Section id="requesting-access" title="Requesting access">
        <p>
          Brand Helper is invite-only. If you don&rsquo;t have an invite yet, you can ask for one
          from the sign-in or landing page — an admin reviews each request.
        </p>
        <ol className="ml-5 list-decimal space-y-1">
          <li>
            On the sign-in or landing page, click <strong>Request access</strong>.
          </li>
          <li>
            Enter your <strong>name</strong>, <strong>organization</strong>, and the{' '}
            <strong>email</strong> you&rsquo;ll sign in with.
          </li>
          <li>An admin reviews the request and approves or declines it.</li>
          <li>
            If approved, you&rsquo;ll get a passwordless <strong>magic-link</strong> email — click
            it to sign in. Access can be revoked or re-instated by an admin at any time.
          </li>
        </ol>
      </Section>

      <Section id="faq" title="FAQ">
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="text-foreground font-medium">
              Why was a product generated instead of reused?
            </dt>
            <dd className="text-muted-foreground">
              Its <code>input_assets</code> were empty. Add an uploaded filename to reuse a hero
              instead of generating one.
            </dd>
          </div>
          <div>
            <dt className="text-foreground font-medium">How do I get a localized overlay?</dt>
            <dd className="text-muted-foreground">
              Set a <code>locale</code> (e.g. <code>ja-JP</code>) on the brief — the message is
              overlaid in English plus a localized translation.
            </dd>
          </div>
          <div>
            <dt className="text-foreground font-medium">How does access work?</dt>
            <dd className="text-muted-foreground">
              Brand Helper is invite-only and sign-in is passwordless (magic link). Each member runs
              the full pipeline on their own records. No invite yet? See{' '}
              <a href="#requesting-access" className="underline">
                Requesting access
              </a>
              .
            </dd>
          </div>
        </dl>
      </Section>
    </div>
  )
}
