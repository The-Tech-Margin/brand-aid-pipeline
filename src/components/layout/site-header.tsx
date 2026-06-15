// Top app chrome: just the brand home link and the primary navigation — which the TTM
// brand always collapses into a hamburger. Theme + mode controls live inside that menu
// (Appearance), not the header. Every navigable UI route lives here, grouped logically
// and gated by auth + role: signed-out visitors see the public pages; members get the
// workspace; admins additionally get the admin group. (Per-entity routes — a campaign's
// creatives, a run's report — aren't global nav targets; they're reached from the
// Dashboard and Reports lists.)
import Image from 'next/image'
import Link from 'next/link'
import { NavMenu, type NavGroup } from '@/components/layout/nav-menu'
import { CommandPalette } from '@/components/layout/command-palette'
import { DEFAULT_BRAND, type Brand } from '@/features/brand-identity/constants'
import type { MemberRow } from '@/types/database'

const GUEST_GROUPS: NavGroup[] = [
  {
    items: [
      { label: 'Home', href: '/' },
      // Public docs (the in-app /help is behind the auth guard, so guests get the static page).
      { label: 'Help', href: '/brandhelperdocs.html', external: true },
      { label: 'Sign in', href: '/login' },
    ],
  },
]

function memberGroups(isAdmin: boolean): NavGroup[] {
  const groups: NavGroup[] = [
    {
      label: 'Workspace',
      items: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'New campaign', href: '/campaigns/new' },
        { label: 'Reports', href: '/reports' },
      ],
    },
    {
      label: 'Settings & help',
      items: [
        { label: 'Design', href: '/theme' },
        { label: 'Help', href: '/help' },
      ],
    },
  ]
  if (isAdmin) {
    groups.push({ label: 'Admin', items: [{ label: 'Members', href: '/admin' }] })
  }
  return groups
}

export function SiteHeader({
  membership,
  brand = DEFAULT_BRAND,
}: {
  membership?: MemberRow | null
  brand?: Brand
}) {
  const isLoggedIn = membership?.status === 'active'
  const isAdmin = membership?.role === 'admin'

  return (
    <>
      <header className="border-border bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <Link
            href={isLoggedIn ? '/dashboard' : '/'}
            className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderRadius: 'var(--radius)' }}
          >
            {brand.logoUrl && (
              <Image
                src={brand.logoUrl}
                alt=""
                width={28}
                height={28}
                priority
                unoptimized
                className="h-7 w-7 object-contain"
              />
            )}
            <span className="gradient-text font-display text-lg">{brand.businessName}</span>
          </Link>
          <nav aria-label="Main">
            <NavMenu
              groups={isLoggedIn ? memberGroups(isAdmin) : GUEST_GROUPS}
              isLoggedIn={isLoggedIn}
            />
          </nav>
        </div>
      </header>
      <CommandPalette isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
    </>
  )
}
