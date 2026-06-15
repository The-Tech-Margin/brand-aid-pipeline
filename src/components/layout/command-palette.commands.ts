// Pure command-palette data + filtering — no React, so it unit-tests on its own. The
// command set mirrors the hamburger nav's routes and role gating (see site-header.tsx)
// so the two navigation surfaces never drift.

export interface Command {
  group: string
  label: string
  href: string
  description: string
  keywords?: string
  /** Primary / generative action — gets a subtle spark, matching the studio launcher. */
  accent?: boolean
  /** A non-route target (static /public doc) — navigated via a full page load, not the router. */
  external?: boolean
}

/** Build the role-aware command list. Guests get the public pages; members get the
 *  workspace; admins additionally get the Members entry — the same gating as the nav. */
export function buildCommands(isLoggedIn: boolean, isAdmin: boolean): Command[] {
  if (!isLoggedIn) {
    return [
      { group: 'Get started', label: 'Home', href: '/', description: 'What Brand Helper does' },
      {
        group: 'Get started',
        label: 'Help guide',
        href: '/brandhelperdocs.html',
        description: 'How the pipeline works, FAQ, and tutorials',
        keywords: 'docs support how to',
        external: true,
      },
      {
        group: 'Get started',
        label: 'Sign in',
        href: '/login',
        description: 'Invite-only — sign in with a magic link',
        keywords: 'login access',
      },
    ]
  }
  const commands: Command[] = [
    {
      group: 'Create',
      label: 'New campaign',
      href: '/campaigns/new',
      description: 'Start a brief → on-brand creatives',
      keywords: 'brief generate run pipeline',
      accent: true,
    },
    {
      group: 'Create',
      label: 'Try an example',
      href: '/campaigns/new?example=summer-glow',
      description: 'Prefill the form with a sample brief',
      keywords: 'demo sample summer glow',
      accent: true,
    },
    {
      group: 'Workspace',
      label: 'Dashboard',
      href: '/dashboard',
      description: 'Your campaigns and recent runs',
      keywords: 'home campaigns',
    },
    {
      group: 'Workspace',
      label: 'Reports',
      href: '/reports',
      description: 'Run reports, compliance, and exports',
      keywords: 'runs compliance export zip',
    },
    {
      group: 'Design',
      label: 'Theme & brand',
      href: '/theme',
      description: 'Colors, fonts, logo, and the global default',
      keywords: 'design studio appearance palette identity',
    },
    {
      group: 'Help',
      label: 'Help guide',
      href: '/help',
      description: 'How the pipeline works, FAQ, and tutorials',
      keywords: 'docs support how to',
    },
  ]
  if (isAdmin) {
    commands.push({
      group: 'Admin',
      label: 'Members',
      href: '/admin',
      description: 'Invite users and manage access',
      keywords: 'invite access roles allowlist',
    })
  }
  return commands
}

/** True if every whitespace-separated term in `query` appears (case-insensitively) in the
 *  command's label, description, group, or keywords. Empty query matches everything. */
export function matches(command: Command, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack =
    `${command.label} ${command.description} ${command.group} ${command.keywords ?? ''}`.toLowerCase()
  return q.split(/\s+/).every((term) => haystack.includes(term))
}
