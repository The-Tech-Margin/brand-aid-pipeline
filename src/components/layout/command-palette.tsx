'use client'

// Floating "do anything" launcher + help — a command palette consistent with the
// other TheTechMargin studio apps. Open it from the floating button or with ⌘K / Ctrl+K,
// type to filter, arrow to move, Enter to go, Esc to close. It mirrors the hamburger
// nav's role gating (the same routes, gated by auth + admin) so the two stay in sync,
// and surfaces Help as a first-class entry. APG combobox + listbox semantics: the input
// is the combobox, the results are a listbox, and selection is driven by
// aria-activedescendant so focus never leaves the input.
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HelpCircleIcon, SearchIcon, SparklesIcon } from '@/components/icons'
import { buildCommands, matches, type Command } from '@/components/layout/command-palette.commands'

interface CommandPaletteProps {
  isLoggedIn: boolean
  isAdmin: boolean
}

export function CommandPalette({ isLoggedIn, isAdmin }: CommandPaletteProps) {
  const router = useRouter()
  const baseId = useId()
  const listId = `${baseId}-list`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [rawActive, setRawActive] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const commands = useMemo(() => buildCommands(isLoggedIn, isAdmin), [isLoggedIn, isAdmin])
  const results = useMemo(() => commands.filter((c) => matches(c, query)), [commands, query])
  // Clamp at render so a shrinking result set never points past the end (no setState-in-effect).
  const active = results.length ? Math.min(rawActive, results.length - 1) : 0

  function openPalette() {
    setQuery('')
    setRawActive(0)
    setOpen(true)
  }

  function close() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  // ⌘K / Ctrl+K toggles the palette from anywhere; a bare "?" opens it (help + actions).
  // Bound to `open` so the reset happens in the handler when opening.
  useEffect(() => {
    function isTyping(target: EventTarget | null): boolean {
      const el = target as HTMLElement | null
      const tag = el?.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!el?.isContentEditable
    }
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) {
          setOpen(false)
          triggerRef.current?.focus()
        } else {
          setQuery('')
          setRawActive(0)
          setOpen(true)
        }
      } else if (e.key === '?' && !open && !isTyping(e.target)) {
        e.preventDefault()
        setQuery('')
        setRawActive(0)
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // While open: focus the input, lock body scroll, and close on an outside click.
  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onDocMouseDown(e: MouseEvent) {
      if (!dialogRef.current?.contains(e.target as Node)) {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('mousedown', onDocMouseDown)
    }
  }, [open])

  function go(command: Command | undefined) {
    if (!command) return
    setOpen(false)
    // Static /public docs aren't router routes — navigate with a full page load.
    if (command.external) window.location.href = command.href
    else router.push(command.href)
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab') {
      // aria-modal dialog: keep focus on the combobox (the only focusable child).
      e.preventDefault()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setRawActive(results.length ? (active + 1) % results.length : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setRawActive(results.length ? (active - 1 + results.length) % results.length : 0)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(results[active])
    } else if (e.key === 'Home') {
      e.preventDefault()
      setRawActive(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setRawActive(Math.max(0, results.length - 1))
    }
  }

  const optionId = (index: number) => `${baseId}-opt-${index}`

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPalette}
        aria-label="Open quick actions and help"
        aria-keyshortcuts="Meta+K Control+K ?"
        title="Quick actions & help (⌘K or ?)"
        className="bg-secondary text-secondary-foreground focus-visible:ring-ring fixed right-4 bottom-4 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ zIndex: 'var(--z-menu)' }}
      >
        <HelpCircleIcon className="h-6 w-6" aria-hidden="true" />
      </button>

      {open && (
        <div className="bh-overlay flex items-start justify-center p-4 pt-[12vh]">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Quick actions and help"
            className="border-border bg-card flex w-full max-w-lg flex-col overflow-hidden border shadow-lg"
            style={{ borderRadius: 'var(--radius-lg, var(--radius))' }}
          >
            <div className="border-border flex items-center gap-2 border-b px-3">
              <SearchIcon className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={results.length ? optionId(active) : undefined}
                aria-label="Search help and actions"
                placeholder="Search help & jump to anything…"
                value={query}
                spellCheck={false}
                autoComplete="off"
                onChange={(e) => {
                  setQuery(e.target.value)
                  setRawActive(0)
                }}
                onKeyDown={onInputKeyDown}
                className="placeholder:text-muted-foreground w-full bg-transparent py-3 text-sm focus:outline-none"
              />
              <kbd className="text-muted-foreground border-border hidden shrink-0 border px-1.5 py-0.5 text-[10px] sm:block">
                Esc
              </kbd>
            </div>

            <ul
              id={listId}
              role="listbox"
              aria-label="Results"
              className="max-h-[50vh] overflow-auto p-1"
            >
              {results.length === 0 && (
                <li className="text-muted-foreground px-3 py-6 text-center text-sm">
                  No matches. Try “campaign”, “report”, “design”, or “help”.
                </li>
              )}
              {results.map((command, index) => {
                const firstOfGroup = index === 0 || results[index - 1]!.group !== command.group
                const selected = index === active
                return (
                  <li key={command.href} role="presentation">
                    {firstOfGroup && (
                      <div
                        role="presentation"
                        className="text-muted-foreground px-3 pt-2 pb-1 text-xs font-medium tracking-wide uppercase"
                      >
                        {command.group}
                      </div>
                    )}
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events -- APG combobox: options are activated from the input (Enter); onClick is the mouse affordance. */}
                    <div
                      id={optionId(index)}
                      role="option"
                      tabIndex={-1}
                      aria-selected={selected}
                      onMouseMove={() => setRawActive(index)}
                      onClick={() => go(command)}
                      className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${selected ? 'bg-muted' : ''}`}
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      {command.accent ? (
                        <SparklesIcon
                          className="text-brand-goldenrod h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="h-4 w-4 shrink-0" aria-hidden="true" />
                      )}
                      <span className="flex min-w-0 flex-col">
                        <span className="text-sm">{command.label}</span>
                        <span className="text-muted-foreground truncate text-xs">
                          {command.description}
                        </span>
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
