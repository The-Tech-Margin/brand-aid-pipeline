// Run report formatting — pure functions shared by the CLI and the web download.
// Produces a marketing-ops-readable Markdown summary plus a machine JSON dump.
import type { RunResult, RunTotals } from '@/features/pipeline/types'
import type { RunStatus } from '@/types/database'
import type { LegalScanResult } from '@/features/pipeline/legal/types'

export interface ReportCreative {
  productName: string
  ratio: string
  source: string
  compliance: { check: string; status: string }[]
}

export interface ReportData {
  campaignName: string
  runId: string
  status: RunStatus
  totals: RunTotals
  legal?: LegalScanResult
  creatives: ReportCreative[]
  events?: { level: string; stage: string; message: string }[]
}

export function reportFromRunResult(result: RunResult, campaignName: string): ReportData {
  return {
    campaignName,
    runId: result.runId,
    status: result.status,
    totals: result.totals,
    legal: result.legal,
    creatives: result.creatives.map((c) => ({
      productName: c.productName,
      ratio: c.ratio,
      source: c.source,
      compliance: c.compliance.map((k) => ({ check: k.check, status: k.status })),
    })),
    events: result.events.map((e) => ({ level: e.level, stage: e.stage, message: e.message })),
  }
}

export function reportToJson(d: ReportData): string {
  return JSON.stringify(d, null, 2)
}

export function reportToMarkdown(d: ReportData): string {
  const t = d.totals
  const lines: string[] = [
    `# Run report — ${d.campaignName}`,
    '',
    `- **Status:** ${d.status}`,
    `- **Creatives:** ${t.creatives} (${t.generated} generated, ${t.reused} reused)`,
    `- **Products:** ${t.products} (${t.failedProducts} failed)`,
    `- **Compliance pass rate:** ${t.compliancePassRate}%`,
    `- **Localized:** ${t.localized ? 'yes' : 'no'}`,
    `- **Elapsed:** ${(t.durationMs / 1000).toFixed(1)}s`,
    '',
  ]

  if (d.legal) {
    lines.push('## Legal scan')
    lines.push(
      `${d.legal.counts.fail} fail · ${d.legal.counts.warn} warn · ${d.legal.counts.info} info`,
    )
    for (const f of d.legal.findings) {
      lines.push(`- [${f.severity}] "${f.term}" in ${f.field} — ${f.reason}`)
    }
    lines.push('')
  }

  lines.push('## Creatives')
  for (const c of d.creatives) {
    const checks = c.compliance.map((k) => `${k.check}:${k.status}`).join(', ')
    lines.push(`- ${c.productName} · ${c.ratio} · ${c.source}${checks ? ` — ${checks}` : ''}`)
  }
  lines.push('')
  return lines.join('\n')
}
