import type { MemberRole, MemberStatus } from '@/types/database'

// Pure predicate (testable without React/DB): only an active admin may review access
// requests and manage visitors. Mirrors members/invite-authorization.ts.
export function canReviewRequests(me: { role: MemberRole; status: MemberStatus } | null): boolean {
  return me?.role === 'admin' && me?.status === 'active'
}
