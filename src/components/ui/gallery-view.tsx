'use client'

// Shared gallery surface used across the studio: a toolbar (search + result count +
// sort + grid/list toggle) over two layouts. The GRID is supplied by the caller
// (`renderGrid`) so each surface keeps its own card design; the LIST is the shared
// table layout driven by `columns`, so every gallery's list view looks and behaves the
// same. Rows are buttons (keyboard-activatable); selection surfaces via `isActive`.
import { useMemo, useState, type ReactNode } from 'react'
import { GridIcon, ListIcon, SearchIcon } from '@/components/icons'
import { filterSortGallery, type GallerySortOption } from './gallery-view.logic'

export type { GallerySortOption }
export type GalleryViewMode = 'grid' | 'list'

export interface GalleryColumn<T> {
  key: string
  header: string
  /** CSS grid track for this column, e.g. '48px', '2fr', '1fr'. */
  width: string
  cell: (item: T) => ReactNode
  align?: 'start' | 'center' | 'end'
}

export interface GalleryViewProps<T> {
  label: string
  items: T[]
  getKey: (item: T) => string
  getSearchText: (item: T) => string
  getRowLabel: (item: T) => string
  columns: GalleryColumn<T>[]
  renderGrid: (items: T[]) => ReactNode
  sorts?: GallerySortOption<T>[]
  onActivate?: (item: T) => void
  isActive?: (item: T) => boolean
  initialView?: GalleryViewMode
  searchPlaceholder?: string
  emptyMessage?: ReactNode
  /** Extra controls rendered at the start of the toolbar (e.g. an Upload button). */
  toolbar?: ReactNode
}

// Alignment applies only from sm up; on mobile cells stack left-aligned as label:value.
function alignClass(align?: 'start' | 'center' | 'end'): string {
  if (align === 'end') return 'sm:justify-end sm:text-right'
  if (align === 'center') return 'sm:justify-center sm:text-center'
  return ''
}

export function GalleryView<T>({
  label,
  items,
  getKey,
  getSearchText,
  getRowLabel,
  columns,
  renderGrid,
  sorts = [],
  onActivate,
  isActive,
  initialView = 'grid',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results.',
  toolbar,
}: GalleryViewProps<T>) {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<GalleryViewMode>(initialView)
  const [sortKey, setSortKey] = useState(sorts[0]?.key ?? '')

  const compare = useMemo(() => sorts.find((s) => s.key === sortKey)?.compare, [sorts, sortKey])
  const results = useMemo(
    () => filterSortGallery(items, query, getSearchText, compare),
    [items, query, getSearchText, compare],
  )

  const template = columns.map((c) => c.width).join(' ')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {toolbar}
        <div
          className="border-border bg-background flex min-w-0 flex-1 items-center gap-2 border px-2 sm:min-w-44"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <SearchIcon className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={`Search ${label}`}
            className="placeholder:text-muted-foreground w-full bg-transparent py-1.5 text-sm focus:outline-none"
          />
        </div>
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {results.length} {results.length === 1 ? 'result' : 'results'}
        </span>
        {sorts.length > 0 && (
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            aria-label={`Sort ${label}`}
            className="border-border bg-background text-foreground border px-2 py-1.5 text-xs focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderRadius: 'var(--radius)' }}
          >
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        )}
        <div
          className="border-border flex border"
          role="group"
          aria-label={`${label} layout`}
          style={{ borderRadius: 'var(--radius)' }}
        >
          <ViewButton active={view === 'grid'} onClick={() => setView('grid')} label="Grid view">
            <GridIcon className="h-4 w-4" aria-hidden="true" />
          </ViewButton>
          <ViewButton active={view === 'list'} onClick={() => setView('list')} label="List view">
            <ListIcon className="h-4 w-4" aria-hidden="true" />
          </ViewButton>
        </div>
      </div>

      {results.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">{emptyMessage}</p>
      ) : view === 'grid' ? (
        renderGrid(results)
      ) : (
        <div className="overflow-x-auto">
          <div className="sm:min-w-[36rem]">
            <div
              className="text-muted-foreground border-border hidden items-center gap-3 border-b px-2 py-1.5 text-xs font-medium tracking-wide uppercase sm:grid"
              style={{ gridTemplateColumns: template }}
              aria-hidden="true"
            >
              {columns.map((c) => (
                <div key={c.key} className={`flex ${alignClass(c.align)}`}>
                  {c.header}
                </div>
              ))}
            </div>
            <ul aria-label={label} className="flex flex-col gap-2 sm:block sm:gap-0">
              {results.map((item) => {
                const active = isActive?.(item)
                const cells = columns.map((c) => (
                  <div
                    key={c.key}
                    className={`flex min-w-0 items-center gap-2 ${alignClass(c.align)}`}
                  >
                    {c.header && (
                      <span className="text-muted-foreground shrink-0 text-xs sm:hidden">
                        {c.header}
                      </span>
                    )}
                    {c.cell(item)}
                  </div>
                ))
                const rowClass = `border-border flex w-full flex-col gap-1 border px-3 py-2 text-left text-sm sm:grid sm:items-center sm:gap-3 sm:border-0 sm:px-2 ${active ? 'bg-muted' : ''}`
                return (
                  <li key={getKey(item)}>
                    {onActivate ? (
                      <button
                        type="button"
                        onClick={() => onActivate(item)}
                        aria-label={getRowLabel(item)}
                        aria-pressed={isActive ? Boolean(active) : undefined}
                        className={`${rowClass} hover:bg-muted focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none`}
                        style={{ gridTemplateColumns: template, borderRadius: 'var(--radius)' }}
                      >
                        {cells}
                      </button>
                    ) : (
                      <div className={rowClass} style={{ gridTemplateColumns: template }}>
                        {cells}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none ${active ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
    >
      {children}
    </button>
  )
}
