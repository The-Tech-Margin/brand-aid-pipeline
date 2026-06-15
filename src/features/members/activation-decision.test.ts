import { describe, it, expect } from 'vitest'
import { decideActivation, type ActivationDecision } from './activation-decision'

describe('decideActivation enforces invite-only access (role is owned by the DB)', () => {
  it('activates any existing membership row, regardless of admin status', () => {
    expect(decideActivation({ hasExistingRow: true, isAdminEmail: false })).toEqual({
      kind: 'activate-existing',
    } satisfies ActivationDecision)
    expect(decideActivation({ hasExistingRow: true, isAdminEmail: true })).toEqual({
      kind: 'activate-existing',
    } satisfies ActivationDecision)
  })

  it('bootstraps an allowlisted admin who has no membership row yet', () => {
    expect(decideActivation({ hasExistingRow: false, isAdminEmail: true })).toEqual({
      kind: 'bootstrap-admin',
    } satisfies ActivationDecision)
  })

  it('denies an uninvited, non-admin sign-in (no auto visitor grant)', () => {
    expect(decideActivation({ hasExistingRow: false, isAdminEmail: false })).toEqual({
      kind: 'deny',
    } satisfies ActivationDecision)
  })

  it('only the deny decision means "not activated"', () => {
    const activated = (d: ActivationDecision): boolean => d.kind !== 'deny'
    expect(activated(decideActivation({ hasExistingRow: true, isAdminEmail: false }))).toBe(true)
    expect(activated(decideActivation({ hasExistingRow: false, isAdminEmail: true }))).toBe(true)
    expect(activated(decideActivation({ hasExistingRow: false, isAdminEmail: false }))).toBe(false)
  })
})
