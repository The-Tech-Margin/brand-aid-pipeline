'use client'

// Primary navigation, always collapsed into a hamburger per the TTM brand. A real
// disclosure menu: aria-haspopup/expanded/controls on the trigger, role="menu" with
// menuitem links, Esc to close with focus restore, Arrow/Home/End roving, and
// outside-click dismiss. Mirrors the theme toggle's accessibility contract.
import { Fragment, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOutIcon, MenuIcon, XIcon } from '@/components/icons'
import { signOut } from '@/features/auth/actions'
import { AppearanceSection } from '@/components/layout/appearance-section'

// Match menuitem, menuitemradio, and menuitemcheckbox so appearance controls join the roving.
const MENUITEM_SELECTOR = '[role^="menuitem"]'

export interface NavItem {
  label: string
  href: string
  /** A non-route target (e.g. a static /public doc) — rendered as a plain anchor so the
   *  browser navigates to it directly instead of the Next router 404ing on an unknown route. */
  external?: boolean
}

/** A labelled section of nav links. The caller decides which groups a given
 *  role/auth state sees, so the menu itself stays presentational. */
export interface NavGroup {
  label?: string
  items: NavItem[]
}

interface NavMenuProps {
  groups: NavGroup[]
  isLoggedIn: boolean
}

export function NavMenu({ groups, isLoggedIn }: NavMenuProps) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>(MENUITEM_SELECTOR)?.focus()
  }, [open])

  function close() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  const itemClass =
    'hover:bg-muted focus-visible:bg-muted aria-[current=page]:text-brand-cyan flex items-center px-3 py-2 text-sm focus-visible:outline-none'

  const renderItem = (item: NavItem) =>
    item.external ? (
      <a
        key={item.href}
        href={item.href}
        role="menuitem"
        onClick={() => setOpen(false)}
        className={itemClass}
        style={{ borderRadius: 'var(--radius)' }}
      >
        {item.label}
      </a>
    ) : (
      <Link
        key={item.href}
        href={item.href}
        role="menuitem"
        aria-current={pathname === item.href ? 'page' : undefined}
        onClick={() => setOpen(false)}
        className={itemClass}
        style={{ borderRadius: 'var(--radius)' }}
      >
        {item.label}
      </Link>
    )

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const menuItems = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(MENUITEM_SELECTOR) ?? [],
    )
    const idx = menuItems.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab') {
      // APG menu-button: Tab closes the menu and lets focus advance naturally.
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      menuItems[(idx + 1) % menuItems.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      menuItems[(idx - 1 + menuItems.length) % menuItems.length]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      menuItems[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      menuItems[menuItems.length - 1]?.focus()
    }
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="border-border hover:bg-card inline-flex h-10 w-10 items-center justify-center border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ borderRadius: 'var(--radius)' }}
      >
        {open ? (
          <XIcon className="h-5 w-5" aria-hidden="true" />
        ) : (
          <MenuIcon className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Main navigation"
          tabIndex={-1}
          onKeyDown={onKeyDown}
          className="border-border bg-card absolute right-0 mt-1 flex min-w-52 flex-col p-1 shadow-lg"
          style={{ borderRadius: 'var(--radius)', zIndex: 'var(--z-menu)' }}
        >
          {groups.map((group, gi) => (
            <Fragment key={group.label ?? `group-${gi}`}>
              {gi > 0 && <hr className="border-border my-1" />}
              {group.label && (
                <span className="text-muted-foreground px-3 pt-1 pb-1 text-xs font-medium tracking-wide uppercase">
                  {group.label}
                </span>
              )}
              {group.items.map(renderItem)}
            </Fragment>
          ))}
          <hr className="border-border my-1" />
          <AppearanceSection />
          {isLoggedIn && (
            <>
              <hr className="border-border my-1" />
              <form action={signOut}>
                <button
                  type="submit"
                  role="menuitem"
                  className="hover:bg-muted focus-visible:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm focus-visible:outline-none"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <LogOutIcon className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}
