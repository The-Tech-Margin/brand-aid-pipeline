'use client'

// Modal dialog — focus trap, Esc to close, focus restore on unmount, scroll lock,
// backdrop click to dismiss. Mirrors the nav menu's focus discipline. Used for
// the creative lightbox.
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { XIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
  /** Optional content rendered above the title row (e.g. a brand lockup). */
  header?: ReactNode
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function Dialog({ open, onClose, title, children, className, header }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const restoreRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement
    const panel = panelRef.current
    const items = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => !el.hasAttribute('disabled'),
      )
    const first = items()[0]
    if (first) first.focus()
    else panel?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'Tab') {
        const list = items()
        if (list.length === 0) return
        const firstEl = list[0]!
        const lastEl = list[list.length - 1]!
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      restoreRef.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- backdrop click-to-dismiss is a mouse convenience; Esc and the close button provide the keyboard path
    <div
      className="bh-overlay flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'border-border bg-card relative max-h-[90vh] w-full max-w-3xl overflow-auto border p-4 shadow-xl focus-visible:outline-none',
          className,
        )}
        style={{ borderRadius: 'var(--radius-lg)', zIndex: 'var(--z-modal)' }}
      >
        {header && <div className="border-border mb-3 border-b pb-3">{header}</div>}
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-xl leading-[1.4] font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="hover:bg-muted inline-flex h-9 w-9 items-center justify-center focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderRadius: 'var(--radius)' }}
          >
            <XIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
