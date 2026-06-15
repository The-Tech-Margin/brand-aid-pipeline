// Pure authorization predicate for the invite action — extracted from actions.ts so
// the "only active admins can invite" rule is testable without a server context.
import type { MemberRole, MemberStatus } from '@/types/database'

export function canInvite(me: { role: MemberRole; status: MemberStatus } | null): boolean {
  return me?.role === 'admin' && me?.status === 'active'
}
