// Dashboard — campaign/run history and the entry point to a new campaign. Sign out
// lives in the nav menu; the only "New campaign" CTA when empty is the empty state.
import Link from 'next/link'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { listCampaignsWithRuns } from '@/features/dashboard/dashboard'
import { RunHistory } from '@/features/dashboard/components/run-history'
import { EmptyState } from '@/features/dashboard/components/empty-state'
import { buttonVariants } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const campaigns = await listCampaignsWithRuns()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl leading-[1.4] font-semibold">
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-sm">Signed in as {user?.email}</p>
        </div>
        {campaigns.length > 0 && (
          <Link
            href="/campaigns/new"
            className={buttonVariants()}
            style={{ borderRadius: 'var(--radius)' }}
          >
            New campaign
          </Link>
        )}
      </div>
      {campaigns.length === 0 ? <EmptyState /> : <RunHistory campaigns={campaigns} />}
    </div>
  )
}
