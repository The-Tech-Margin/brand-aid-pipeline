import 'server-only'

// Reports read layer — every campaign with its runs, enriched with the brand-
// compliance pass rate (from the run totals) and legal flag counts (re-derived from
// the persisted brief, like the run report). RLS-scoped to the signed-in user.
import { createSupabaseServerClient } from '@/services/supabase/server'
import { getOwnerLabels } from '@/features/members/data'
import { scanBrief } from '@/features/pipeline/legal/scanner'
import { defaultRules } from '@/features/pipeline/legal/lexicon'
import type { RunStatus } from '@/types/database'
import type { RunTotals } from '@/features/pipeline/types'
import type { Brief } from '@/features/brief/schema'

export interface ReportRun {
  runId: string
  status: RunStatus
  totals: RunTotals
  legal: { fail: number; warn: number; info: number }
  startedAt: string
  finishedAt: string | null
}

export interface CampaignReport {
  campaignId: string
  name: string
  region: string
  ownerName: string
  createdAt: string
  runs: ReportRun[]
}

export async function listReports(): Promise<CampaignReport[]> {
  const supabase = await createSupabaseServerClient()
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, region, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  if (!campaigns || campaigns.length === 0) return []

  const owners = await getOwnerLabels(campaigns.map((c) => c.user_id))

  const { data: runs } = await supabase
    .from('runs')
    .select('id, campaign_id, status, totals, brief, started_at, finished_at')
    .order('started_at', { ascending: false })

  const byCampaign = new Map<string, ReportRun[]>()
  for (const r of runs ?? []) {
    const brief = r.brief ? (r.brief as unknown as Brief) : null
    const legal = brief ? scanBrief(brief, defaultRules).counts : { fail: 0, warn: 0, info: 0 }
    const list = byCampaign.get(r.campaign_id) ?? []
    list.push({
      runId: r.id,
      status: r.status,
      totals: r.totals as unknown as RunTotals,
      legal,
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
