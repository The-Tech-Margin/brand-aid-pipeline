'use client'

// Collapsible developer error detail with copy-to-clipboard. Rendered only outside
// production (Next statically replaces process.env.NODE_ENV, so the block is dropped
// from prod bundles) — users see friendly copy; developers can copy the stack.
import { useState } from 'react'
import { CopyIcon, CheckIcon } from '@/components/icons'

interface ErrorDetailProps {
  error: Error & { digest?: string }
}

export function ErrorDetail({ error }: ErrorDetailProps) {
  const [copied, setCopied] = useState(false)
  if (process.env.NODE_ENV === 'production') return null

  const text = [
    `${error.name || 'Error'}: ${error.message}`,
    error.digest ? `digest: ${error.digest}` : null,
    error.stack ? `\n${error.stack}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard may be unavailable (insecure context); silently no-op.
    }
  }

  return (
    <details
      className="border-border bg-muted/40 mt-6 w-full max-w-2xl border text-left"
      style={{ borderRadius: 'var(--radius)' }}
    >
      <summary className="text-muted-foreground cursor-pointer px-3 py-2 text-sm font-medium select-none">
        Developer details
      </summary>
      <div className="border-border relative border-t">
        <button
          type="button"
          onClick={copy}
          className="bg-card hover:bg-muted border-border absolute top-2 right-2 inline-flex items-center gap-1.5 border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ borderRadius: 'var(--radius)' }}
        >
          {copied ? (
            <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <CopyIcon className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <pre className="overflow-auto p-3 pr-20 font-mono text-xs leading-relaxed whitespace-pre-wrap">
          {text}
        </pre>
      </div>
    </details>
  )
}
