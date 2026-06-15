'use client'

// Accessible tabs — roving tabindex, Arrow/Home/End keyboard nav, real
// aria-selected/aria-controls wiring. Self-contained: renders the active panel
// so the tab↔panel relationship is genuine. Mirrors the nav menu's keyboard model.
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
  value: string
  label: string
}

interface TabsProps {
  items: TabItem[]
  value: string
  onValueChange: (value: string) => void
  panels: Record<string, ReactNode>
  label: string
  className?: string
}

export function Tabs({ items, value, onValueChange, panels, label, className }: TabsProps) {
  const baseId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const panelId = `${baseId}-panel`
  const activeTabId = `${baseId}-${value}`

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const idx = items.findIndex((i) => i.value === value)
    let next = idx
    if (e.key === 'ArrowRight') next = (idx + 1) % items.length
    else if (e.key === 'ArrowLeft') next = (idx - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else return
    e.preventDefault()
    onValueChange(items[next]!.value)
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  return (
    <div className={className}>
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- roving focus lives on the tab buttons (ARIA APG); the tablist only delegates arrow keys */}
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="border-border inline-flex max-w-full gap-1 overflow-x-auto border p-1"
        style={{ borderRadius: 'var(--radius)' }}
      >
        {items.map((item) => {
          const selected = item.value === value
          return (
            <button
              key={item.value}
              role="tab"
              id={`${baseId}-${item.value}`}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onValueChange(item.value)}
              className={cn(
                'shrink-0 px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2',
                selected ? 'bg-brand-pink text-white' : 'hover:bg-muted',
              )}
              style={{ borderRadius: 'calc(var(--radius) - 1px)' }}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={activeTabId}
        tabIndex={0}
        className="mt-4 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {panels[value]}
      </div>
    </div>
  )
}
