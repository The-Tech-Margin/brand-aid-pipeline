import { describe, it, expect } from 'vitest'
import { canInvite } from './invite-authorization'

describe('canInvite — only active admins may invite', () => {
  it('rejects a signed-out / unknown caller', () => {
    expect(canInvite(null)).toBe(false)
  })

  it('rejects an active visitor', () => {
    expect(canInvite({ role: 'visitor', status: 'active' })).toBe(false)
  })

  it('rejects an admin who is not yet active', () => {
    expect(canInvite({ role: 'admin', status: 'invited' })).toBe(false)
  })

  it('allows an active admin', () => {
    expect(canInvite({ role: 'admin', status: 'active' })).toBe(true)
  })
})
