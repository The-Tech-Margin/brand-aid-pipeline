// 404 — branded, accessible. Rendered within the root layout (header/footer intact).
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main
      id="content"
      className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center"
    >
      <p className="gradient-text mb-1 text-6xl leading-[1.4] font-semibold">404</p>
      <h1 className="mb-2 text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground mb-6 max-w-md text-sm">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
      </p>
      <Link
        href="/dashboard"
        className={buttonVariants()}
        style={{ borderRadius: 'var(--radius)' }}
      >
        Back to dashboard
      </Link>
    </main>
  )
}
