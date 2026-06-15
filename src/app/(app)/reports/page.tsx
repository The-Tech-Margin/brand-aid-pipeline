// Reports & data management — every run's brand-compliance pass rate and legal flag
// counts in one place, linking to the full report (compliance / legal / log / export)
// and the creative outputs by product → aspect ratio. Auth is enforced by the (app)
// layout; RLS scopes all rows to the signed-in member.
import Link from 'next/link'
import { listReports } from '@/features/reports/data'
import { ReportsView } from '@/features/reports/components/reports-view'

export const metadata = {
  title: 'Reports · Brand Helper',
}

export default async function ReportsPage() {
  const campaigns = await listReports()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard" className="text-muted-foreground text-sm hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-3xl leading-[1.4] font-semibold">
          <span className="gradient-text">Reports</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Every run with its brand-compliance pass rate and legal flags. Open a report for the full
          compliance, legal, and log detail and JSON/Markdown export, or browse the creative outputs
          organized by product and aspect ratio. Delete runs or whole campaigns to manage your data.
        </p>
      </div>
      <ReportsView campaigns={campaigns} />
    </div>
  )
}
