// Run report read layer — assembles a run's totals, structured log, per-creative
// compliance and legal findings for the report page. Legal findings are re-derived
// from the persisted brief (deterministic, no extra table). RLS-scoped.
import 'server-only'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { scanBrief } from '@/features/pipeline/legal/scanner'
import { defaultRules } from '@/features/pipeline/legal/lexicon'
import type { RunStatus } from '@/types/database'
import type { RunTotals } from '@/features/pipeline/types'
import type { Brief } from '@/features/brief/schema'
import type { LegalScanResult } from '@/features/pipeline/legal/types'
import type { ReportCreative } from '@/features/runs/report'

export interface RunReportView {
  runId: string
  campaignId: string
  campaignName: string
  status: RunStatus
  mode: string
  totals: RunTotals
  startedAt: string
  finishedAt: string | null
  events: { id: string; level: string; stage: string; message: string; createdAt: string }[]
  legal: LegalScanResult
  creatives: ReportCreative[]
}

const EMPTY_LEGAL: LegalScanResult = {
  findings: [],
  failed: false,
  counts: { fail: 0, warn: 0, info: 0 },
}

export async function getRunReport(runId: string): Promise<RunReportView | null> {
  const supabase = await createSupabaseServerClient()
  const { data: run } = await supabase
    .from('runs')
    .select('id, campaign_id, status, totals, brief, mode, started_at, finished_at')
    .eq('id', runId)
    .single()
  if (!run) return null

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('name')
    .eq('id', run.campaign_id)
    .single()

  const { data: events } = await supabase
    .from('run_events')
    .select('id, level, stage, message, created_at')
    .eq('run_id', runId)
    .order('created_at', { ascending: true })

  const { data: assets } = await supabase
    .from('assets')
    .select('id, product_id, aspect_ratio, source')
    .eq('campaign_id', run.campaign_id)
    .eq('kind', 'creative')

  const creatives = await buildCreatives(supabase, assets ?? [])
  const brief = run.brief ? (run.brief as unknown as Brief) : null

  return {
    runId: run.id,
    campaignId: run.campaign_id,
    campaignName: campaign?.name ?? 'Campaign',
    status: run.status,
    mode: run.mode,
    totals: run.totals as unknown as RunTotals,
    startedAt: run.started_at,
    finishedAt: run.finished_at,
    events: (events ?? []).map((e) => ({
      id: e.id,
      level: e.level,
      stage: e.stage,
      message: e.message,
      createdAt: e.created_at,
    })),
    legal: brief ? scanBrief(brief, defaultRules) : EMPTY_LEGAL,
    creatives,
  }
}

type AssetSummary = {
  id: string
  product_id: string | null
  aspect_ratio: string | null
  source: string | null
}
type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

async function buildCreatives(
  supabase: ServerClient,
  assets: AssetSummary[],
): Promise<ReportCreative[]> {
  if (assets.length === 0) return []

  const productIds = [...new Set(assets.map((a) => a.product_id).filter((x): x is string => !!x))]
  const { data: products } = await supabase.from('products').select('id, name').in('id', productIds)
  const names = new Map((products ?? []).map((p) => [p.id, p.name]))

  const { data: compliance } = await supabase
    .from('compliance_results')
    .select('asset_id, check, status')
    .in(
      'asset_id',
      assets.map((a) => a.id),
    )
  const byAsset = new Map<string, { check: string; status: string }[]>()
  for (const c of compliance ?? []) {
    const list = byAsset.get(c.asset_id) ?? []
    list.push({ check: c.check, status: c.status })
    byAsset.set(c.asset_id, list)
  }

  return assets.map((a) => ({
    productName: (a.product_id && names.get(a.product_id)) || 'Unknown',
    ratio: a.aspect_ratio ?? '1:1',
    source: a.source ?? 'generated',
    compliance: byAsset.get(a.id) ?? [],
  }))
}
