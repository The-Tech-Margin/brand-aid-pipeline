'use client'

// Route-segment error boundary — branded, accessible recovery UI. `reset()` retries
// the segment; developer detail (copyable) shows outside production.
import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangleIcon } from '@/components/icons'
import { Button, buttonVariants } from '@/components/ui/button'
import { ErrorDetail } from '@/components/feedback/error-detail'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main
      id="content"
      className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center"
    >
      <AlertTriangleIcon className="text-brand-hot-red mb-4 h-10 w-10" aria-hidden="true" />
      <h1 className="mb-2 text-2xl leading-[1.4] font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground mb-6 max-w-md text-sm">
        An unexpected error interrupted this page. You can try again, or head back to your
        dashboard.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: 'outline' })}
          style={{ borderRadius: 'var(--radius)' }}
        >
          Go to dashboard
        </Link>
      </div>
      <ErrorDetail error={error} />
    </main>
  )
}
