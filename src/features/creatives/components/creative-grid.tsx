'use client'

// Keyboard-navigable creative grid — 2D Arrow-key roving tabindex (Left/Right move
// by one, Up/Down by a row, Home/End jump), Enter/Space opens the lightbox via the
// card button. Satisfies the spec's grid keyboard requirement.
import { useRef, useState, type KeyboardEvent } from 'react'
import { CreativeCard } from './creative-card'
import type { CreativeItem } from '@/features/creatives/creatives'

interface CreativeGridProps {
  items: CreativeItem[]
  onOpen: (item: CreativeItem) => void
  /** Logical columns for vertical Arrow navigation. */
  columns?: number
}

export function CreativeGrid({ items, onOpen, columns = 4 }: CreativeGridProps) {
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  // Clamp at render so a shrinking/reordered list (GalleryView search/sort) always keeps
  // exactly one in-range roving tab stop — no setState-in-effect needed.
  const safeActive = items.length ? Math.min(active, items.length - 1) : 0

  function focusIndex(i: number) {
    const clamped = Math.max(0, Math.min(items.length - 1, i))
    setActive(clamped)
    ref.current?.querySelectorAll<HTMLButtonElement>('[data-creative]')[clamped]?.focus()
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    let next = safeActive
    if (e.key === 'ArrowRight') next = active + 1
    else if (e.key === 'ArrowLeft') next = active - 1
    else if (e.key === 'ArrowDown') next = active + columns
    else if (e.key === 'ArrowUp') next = active - columns
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else return
    e.preventDefault()
    focusIndex(next)
  }

  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- roving tabindex lives on the grid cells (design-system.md); the grid only delegates arrow keys
    <div
      ref={ref}
      role="grid"
      aria-label="Creatives"
      onKeyDown={onKeyDown}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      {items.map((item, i) => (
        <div role="gridcell" key={item.assetId}>
          <CreativeCard
            item={item}
            tabIndex={i === safeActive ? 0 : -1}
            onActivate={() => {
              setActive(i)
              onOpen(item)
            }}
          />
        </div>
      ))}
    </div>
  )
}
