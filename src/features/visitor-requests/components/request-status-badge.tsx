// Presentational: maps an access-request status to a Badge tone.
import { Badge, type BadgeTone } from '@/components/ui/badge'
import type { AccessRequestStatus } from '@/types/database'

const TONE: Record<AccessRequestStatus, BadgeTone> = {
  pending: 'info',
  approved: 'success',
  denied: 'muted',
}

export function RequestStatusBadge({ status }: { status: AccessRequestStatus }) {
  return <Badge tone={TONE[status]}>{status}</Badge>
}
