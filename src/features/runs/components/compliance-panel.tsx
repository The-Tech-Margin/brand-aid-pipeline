// Per-creative brand-compliance breakdown with a pass-rate summary.
import { Badge, toneForCompliance } from '@/components/ui/badge'
import type { ComplianceStatus } from '@/types/database'
import type { ReportCreative } from '@/features/runs/report'

export function CompliancePanel({ creatives }: { creatives: ReportCreative[] }) {
  const checks = creatives.flatMap((c) => c.compliance)
  if (checks.length === 0) {
    return <p className="text-muted-foreground text-sm">No compliance results yet.</p>
  }
  const passes = checks.filter((c) => c.status === 'pass').length
  const rate = Math.round((passes / checks.length) * 100)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        {passes}/{checks.length} checks passed ({rate}%)
      </p>
      <ul className="flex flex-col gap-3">
        {creatives.map((c, i) => (
          <li key={i} className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">
              {c.productName} · {c.ratio}{' '}
              <span className="text-muted-foreground font-normal">({c.source})</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {c.compliance.map((k, j) => (
                <Badge key={j} tone={toneForCompliance(k.status as ComplianceStatus)}>
                  {k.check}: {k.status}
                </Badge>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
