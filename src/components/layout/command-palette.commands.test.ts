// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { buildCommands, matches, type Command } from './command-palette.commands'

function find(commands: Command[], label: string): Command | undefined {
  return commands.find((c) => c.label === label)
}

describe('buildCommands', () => {
  it('gives guests only the public pages (home, public help, sign in)', () => {
    const commands = buildCommands(false, false)
    expect(commands.map((c) => c.href)).toEqual(['/', '/brandhelperdocs.html', '/login'])
  })

  it('gives members the workspace but not the admin entry', () => {
    const commands = buildCommands(true, false)
    expect(find(commands, 'New campaign')).toBeDefined()
    expect(find(commands, 'Help guide')).toBeDefined()
    expect(find(commands, 'Members')).toBeUndefined()
  })

  it('adds the Members entry only for admins', () => {
    const members = find(buildCommands(true, true), 'Members')
    expect(members).toBeDefined()
    expect(members?.href).toBe('/admin')
  })

  it('marks the generative actions with accent and surfaces Help in every signed-in set', () => {
    const commands = buildCommands(true, false)
    expect(find(commands, 'New campaign')?.accent).toBe(true)
    expect(find(commands, 'Dashboard')?.accent).toBeUndefined()
    expect(find(commands, 'Help guide')?.group).toBe('Help')
  })
})

describe('matches', () => {
  const cmd: Command = {
    group: 'Workspace',
    label: 'Reports',
    href: '/reports',
    description: 'Run reports, compliance, and exports',
    keywords: 'runs compliance export zip',
  }

  it('matches everything on an empty query', () => {
    expect(matches(cmd, '')).toBe(true)
    expect(matches(cmd, '   ')).toBe(true)
  })

  it('is case-insensitive and searches label, description, group, and keywords', () => {
    expect(matches(cmd, 'REPORTS')).toBe(true)
    expect(matches(cmd, 'compliance')).toBe(true) // description
    expect(matches(cmd, 'workspace')).toBe(true) // group
    expect(matches(cmd, 'zip')).toBe(true) // keyword
  })

  it('requires every term to match (AND semantics)', () => {
    expect(matches(cmd, 'reports export')).toBe(true)
    expect(matches(cmd, 'reports nope')).toBe(false)
  })
})
