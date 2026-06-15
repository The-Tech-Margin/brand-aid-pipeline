// Pure decision logic for "what should happen when this user signs in" — extracted
// from activate.ts so it's testable without a DB. Enforces invite-only access: a
// user with no membership row is granted access ONLY if their email is on the DB
// admin allowlist (bootstrap); everyone else is denied (they must be invited by an
// admin first). The ROLE itself is owned by the DB — a trigger stamps members.role
// from brand_helper.admin_allowlist on every write (see migration 0006) — so this
// logic never assigns a role, it only decides whether to activate, bootstrap, or deny.

export type ActivationDecision =
  | { kind: 'activate-existing' } // a membership row exists → mark it active
  | { kind: 'bootstrap-admin' } // no row + allowlisted admin → create an active row
  | { kind: 'deny' } // no row + not allowlisted → no access (must be invited)

export interface ActivationInput {
  hasExistingRow: boolean
  isAdminEmail: boolean
}

export function decideActivation(input: ActivationInput): ActivationDecision {
  if (input.hasExistingRow) return { kind: 'activate-existing' }
  return input.isAdminEmail ? { kind: 'bootstrap-admin' } : { kind: 'deny' }
}
