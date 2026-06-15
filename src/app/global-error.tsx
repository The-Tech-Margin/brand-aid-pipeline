'use client'

// Root error boundary — replaces the whole document when the root layout itself
// throws, so it renders its own <html>/<body> and imports globals.css for tokens.
// Fonts aren't loaded here (rare fallback); the display face degrades gracefully.
import './globals.css'
import { AlertTriangleIcon } from '@/components/icons'
import { ErrorDetail } from '@/components/feedback/error-detail'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en" data-theme="branded" data-mode="dark">
      <body className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center antialiased">
        <AlertTriangleIcon className="text-brand-hot-red mb-4 h-10 w-10" aria-hidden="true" />
        <h1 className="mb-2 text-2xl leading-[1.4] font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground mb-6 max-w-md text-sm">
          The app hit an unexpected error. Reloading usually fixes it.
        </p>
        <button
          type="button"
          onClick={reset}
          className="bg-brand-pink px-4 py-2 text-sm font-medium text-white focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ borderRadius: 'var(--radius)' }}
        >
          Try again
        </button>
        <ErrorDetail error={error} />
      </body>
    </html>
  )
}
