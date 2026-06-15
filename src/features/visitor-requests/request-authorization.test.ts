import { describe, it, expect } from 'vitest'
import { canReviewRequests } from './request-authorization'

describe('canReviewRequests — only active admins may review/manage', () => {
  it('rejects a signed-out / unknown caller', () => {
    expect(canReviewRequests(null)).toBe(false)
  })

  it('rejects an active visitor', () => {
    expect(canReviewRequests({ role: 'visitor', status: 'active' })).toBe(false)
  })

  it('rejects an admin who is not yet active', () => {
    expect(canReviewRequests({ role: 'admin', status: 'invited' })).toBe(false)
  })

  it('rejects a revoked admin', () => {
    expect(canReviewRequests({ role: 'admin', status: 'revoked' })).toBe(false)
  })

  it('allows an active admin', () => {
    expect(canReviewRequests({ role: 'admin', status: 'active' })).toBe(true)
  })
})
