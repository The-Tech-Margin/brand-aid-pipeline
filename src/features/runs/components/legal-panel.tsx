// Legal-content scan results — grouped by severity. Presentational.
import { Badge, toneForSeverity } from '@/components/ui/badge'
import type { LegalScanResult } from '@/features/pipeline/legal/types'

export function LegalPanel({ legal }: { legal: LegalScanResult }) {
  if (legal.findings.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No prohibited terms or unsupported claims detected.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">
        {legal.counts.fail} fail · {legal.counts.warn} warn · {legal.counts.info} info
      </p>
      <ul className="flex flex-col gap-2">
        {legal.findings.map((f, i) => (
          <li key={i} className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="font-medium">“{f.term}”</span>{' '}
              <span className="text-muted-foreground">
                in {f.field} — {f.reason}
              </span>
            </span>
            <Badge tone={toneForSeverity(f.severity)}>{f.severity}</Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}
