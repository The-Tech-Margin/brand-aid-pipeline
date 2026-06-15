// Run report — totals, live progress log, per-creative compliance and legal scan,
// plus JSON/Markdown export. Server-rendered from RLS-scoped reads.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRunReport } from '@/features/runs/runs'
import { RunSummary } from '@/features/runs/components/run-summary'
import { RunProgress } from '@/features/runs/components/run-progress'
import { CompliancePanel } from '@/features/runs/components/compliance-panel'
import { LegalPanel } from '@/features/runs/components/legal-panel'
import { RunDownload } from '@/features/runs/components/run-download'
import { Card, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import type { ReportData } from '@/features/runs/report'

export default async function RunReportPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params
  const report = await getRunReport(runId)
  if (!report) notFound()

  const reportData: ReportData = {
    campaignName: report.campaignName,
    runId: report.runId,
    status: report.status,
    totals: report.totals,
    legal: report.legal,
    creatives: report.creatives,
    events: report.events.map((e) => ({ level: e.level, stage: e.stage, message: e.message })),
  }
  const running = report.status === 'pending' || report.status === 'running'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-muted-foreground text-sm hover:underline">
            ← Dashboard
          </Link>
          <h1 className="mt-1 text-3xl leading-[1.4] font-semibold">
            <span className="gradient-text">{report.campaignName}</span>
          </h1>
          <p className="text-muted-foreground text-sm">Run report</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/campaigns/${report.campaignId}/creatives`}
            className={buttonVariants({ variant: 'outline' })}
            style={{ borderRadius: 'var(--radius)' }}
          >
            Browse creatives
          </Link>
          <RunDownload report={reportData} />
        </div>
      </div>

      <RunSummary status={report.status} mode={report.mode} totals={report.totals} />

      <Card>
        <CardTitle className="mb-3">{running ? 'Live progress' : 'Run log'}</CardTitle>
        <RunProgress
          runId={report.runId}
          initialStatus={report.status}
          initialEvents={report.events}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-3">Brand compliance</CardTitle>
          <CompliancePanel creatives={report.creatives} />
        </Card>
        <Card>
          <CardTitle className="mb-3">Legal scan</CardTitle>
          <LegalPanel legal={report.legal} />
        </Card>
      </div>
    </div>
  )
}
