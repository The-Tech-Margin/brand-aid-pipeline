// Run summary stat grid — reads like a marketing-ops snapshot.
import { Badge, StatusDot, toneForRun } from '@/components/ui/badge'
import { formatDuration } from '@/lib/format'
import type { RunStatus } from '@/types/database'
import type { RunTotals } from '@/features/pipeline/types'

interface RunSummaryProps {
  status: RunStatus
  mode: string
  totals: RunTotals
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-border bg-card border p-3" style={{ borderRadius: 'var(--radius)' }}>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}

export function RunSummary({ status, mode, totals }: RunSummaryProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Badge tone={toneForRun(status)}>
          <StatusDot tone={toneForRun(status)} />
          {status}
        </Badge>
        <span className="text-muted-foreground text-xs">{mode} mode</span>
        <span className="text-muted-foreground text-xs">
          {totals.localized ? '· localized overlay' : '· English overlay'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Creatives" value={totals.creatives ?? 0} />
        <Stat label="Generated" value={totals.generated ?? 0} />
        <Stat label="Reused" value={totals.reused ?? 0} />
        <Stat label="Failed" value={totals.failedProducts ?? 0} />
        <Stat label="Compliance" value={`${totals.compliancePassRate ?? 0}%`} />
        <Stat label="Elapsed" value={formatDuration(totals.durationMs ?? 0)} />
      </div>
    </div>
  )
}
