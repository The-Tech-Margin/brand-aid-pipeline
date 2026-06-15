// Dashboard read layer — campaigns with their runs, newest first. Uses the
// RLS-scoped server client so rows are automatically limited to the signed-in user.
import 'server-only'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { getOwnerLabels } from '@/features/members/data'
import type { RunStatus } from '@/types/database'
import type { RunTotals } from '@/features/pipeline/types'

export interface RunSummaryRow {
  runId: string
  status: RunStatus
  totals: RunTotals
  startedAt: string
  finishedAt: string | null
}

export interface CampaignWithRuns {
  campaignId: string
  name: string
  region: string
  ownerName: string
  createdAt: string
  runs: RunSummaryRow[]
}

export async function listCampaignsWithRuns(): Promise<CampaignWithRuns[]> {
  const supabase = await createSupabaseServerClient()
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, region, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (!campaigns || campaigns.length === 0) return []

  const owners = await getOwnerLabels(campaigns.map((c) => c.user_id))

  const { data: runs } = await supabase
    .from('runs')
    .select('id, campaign_id, status, totals, started_at, finished_at')
    .order('started_at', { ascending: false })

  const byCampaign = new Map<string, RunSummaryRow[]>()
  for (const r of runs ?? []) {
    const list = byCampaign.get(r.campaign_id) ?? []
    list.push({
      runId: r.id,
      status: r.status,
      totals: r.totals as unknown as RunTotals,
      startedAt: r.started_at,
      finishedAt: r.finished_at,
    })
    byCampaign.set(r.campaign_id, list)
  }

  return campaigns.map((c) => ({
    campaignId: c.id,
    name: c.name,
    region: c.region,
    ownerName: owners.get(c.user_id) ?? '—',
    createdAt: c.created_at,
    runs: byCampaign.get(c.id) ?? [],
  }))
}
