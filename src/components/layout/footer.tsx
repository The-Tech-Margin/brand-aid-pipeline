// Required TheTechMargin brand footer. Shown on branded/custom skins; hidden in plain.
// Text is fixed by brand guidelines and must not be altered; the wordmark links to
// thetechmargin.com.
export function BrandFooter() {
  return (
    <footer
      className="brand-footer mt-auto w-full py-8 text-center text-sm"
      style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}
    >
      <p>
        made with{' '}
        <span aria-hidden="true" style={{ color: 'var(--brand-hot-red)' }}>
          ♥
        </span>
        <span className="sr-only">love</span> by{' '}
        <a
          href="https://www.thetechmargin.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-display gradient-text text-base focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ borderRadius: 'var(--radius)' }}
        >
          thetechmargin
        </a>
      </p>
    </footer>
  )
}
