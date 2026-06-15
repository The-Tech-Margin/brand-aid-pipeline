// Supabase implementation of the pipeline persistence port. Uses the service-role
// admin client (RLS-bypassing) but always scopes writes to the run's user. Uploads
// creatives to private storage and mirrors the hierarchy in Postgres.
import 'server-only'
import { createSupabaseAdminClient } from '@/services/supabase/admin'
import { env } from '@/config/env'
import { slugify } from '@/lib/slug'
import { ratioPathSegment, type AspectRatio, type Brief } from '@/features/brief/schema'
import type { ComplianceCheck } from '@/features/pipeline/compliance/types'
import type { RunMode, RunStatus } from '@/types/database'
import type {
  CreativeResult,
  PipelinePersistence,
  RunEvent,
  RunState,
  RunTotals,
  SaveCreativeArgs,
} from './types'

export class SupabasePersistence implements PipelinePersistence {
  private readonly db = createSupabaseAdminClient()
  private readonly bucket = env.storageBucket()

  // The run owner, so loadInputAsset can resolve their uploaded library assets
  // (input-assets/{userId}/…) in addition to campaign-scoped and shared seeds.
  constructor(private readonly userId?: string) {}

  async createCampaign(brief: Brief, userId: string) {
    const { data: campaign, error } = await this.db
      .from('campaigns')
      .insert({
        user_id: userId,
        name: brief.campaign_name,
        region: brief.target_region,
        audience: brief.target_audience,
        message: brief.campaign_message,
        locale: brief.locale ?? null,
        status: 'running',
        brand_palette: brief.brand_palette ?? null,
      })
      .select('id')
      .single()
    if (error || !campaign) throw new Error(`createCampaign failed: ${error?.message}`)

    const rows = brief.products.map((p) => ({
      campaign_id: campaign.id,
      name: p.name,
      description: p.description,
      slug: slugify(p.name),
      input_assets: p.input_assets,
    }))
    const { data: products, error: productError } = await this.db
      .from('products')
      .insert(rows)
      .select('id, slug')
    if (productError || !products)
      throw new Error(`create products failed: ${productError?.message}`)

    const productIds = Object.fromEntries(products.map((p) => [p.slug, p.id]))
    return { campaignId: campaign.id, productIds }
  }

  async createRun(
    campaignId: string,
    userId: string,
    brief: Brief,
    mode: RunMode,
  ): Promise<string> {
    const { data, error } = await this.db
      .from('runs')
      .insert({
        campaign_id: campaignId,
        user_id: userId,
        status: 'running',
        mode,
        next_product_index: 0,
        brief: brief as unknown as Record<string, unknown>,
      })
      .select('id')
      .single()
    if (error || !data) throw new Error(`createRun failed: ${error?.message}`)
    return data.id
  }

  async saveCreative(args: SaveCreativeArgs) {
    const storagePath = `creatives/${args.campaignId}/${args.productSlug}/${ratioPathSegment(args.ratio)}/01.png`
    const { error: uploadError } = await this.db.storage
      .from(this.bucket)
      .upload(storagePath, args.bytes, { contentType: 'image/png', upsert: true })
    if (uploadError) throw new Error(`upload failed: ${uploadError.message}`)

    const { data, error } = await this.db
      .from('assets')
      .insert({
        campaign_id: args.campaignId,
        product_id: args.productId,
        kind: 'creative',
        aspect_ratio: args.ratio,
        storage_path: storagePath,
        source: args.source,
        variant: '01',
        width: args.width,
        height: args.height,
      })
      .select('id')
      .single()
    if (error || !data) throw new Error(`save asset failed: ${error?.message}`)
    return { assetId: data.id, storagePath }
  }

  async saveComplianceResults(assetId: string, checks: ComplianceCheck[]): Promise<void> {
    if (checks.length === 0) return
    const rows = checks.map((c) => ({
      asset_id: assetId,
      check: c.check,
      status: c.status,
      detail: c.detail,
    }))
    const { error } = await this.db.from('compliance_results').insert(rows)
    if (error) throw new Error(`save compliance failed: ${error.message}`)
  }

  async saveEvents(runId: string, events: RunEvent[]): Promise<void> {
    if (events.length === 0) return
    const rows = events.map((e) => ({
      run_id: runId,
      level: e.level,
      stage: e.stage,
      message: e.message,
      meta: e.meta ?? {},
    }))
    const { error } = await this.db.from('run_events').insert(rows)
    if (error) throw new Error(`save events failed: ${error.message}`)
  }

  async finalizeRun(runId: string, status: RunStatus, totals: RunTotals): Promise<void> {
    const { error } = await this.db
      .from('runs')
      .update({ status, totals, finished_at: new Date().toISOString() })
      .eq('id', runId)
    if (error) throw new Error(`finalize run failed: ${error.message}`)
  }

  async loadInputAsset(campaignId: string, path: string): Promise<Uint8Array | null> {
    // Defense in depth: `path` is a brief value fetched with the admin (RLS-bypassing)
    // client, so never let it escape the asset prefix even if validation is bypassed.
    if (path.includes('/') || path.includes('\\') || path.includes('..')) return null
    // Try the owner's uploaded library, then campaign-scoped, then the shared seeds.
    const candidates = [
      ...(this.userId ? [`input-assets/${this.userId}/${path}`] : []),
      `input-assets/${campaignId}/${path}`,
      `input-assets/${path}`,
      path,
    ]
    for (const candidate of candidates) {
      const { data, error } = await this.db.storage.from(this.bucket).download(candidate)
      if (!error && data) return new Uint8Array(await data.arrayBuffer())
    }
    return null
  }

  async getRunState(runId: string): Promise<RunState | null> {
    const { data, error } = await this.db
      .from('runs')
      .select('campaign_id, user_id, brief, mode, next_product_index, status, started_at')
      .eq('id', runId)
      .single()
    if (error || !data || !data.brief) return null
    return {
      campaignId: data.campaign_id,
      userId: data.user_id,
      brief: data.brief as unknown as Brief,
      mode: data.mode,
      nextProductIndex: data.next_product_index,
      status: data.status,
      startedAt: data.started_at,
    }
  }

  async advanceRunCursor(runId: string, nextProductIndex: number): Promise<void> {
    const { error } = await this.db
      .from('runs')
      .update({ next_product_index: nextProductIndex })
      .eq('id', runId)
    if (error) throw new Error(`advance cursor failed: ${error.message}`)
  }

  async loadProductIds(campaignId: string): Promise<Record<string, string>> {
    const { data, error } = await this.db
      .from('products')
      .select('id, slug')
      .eq('campaign_id', campaignId)
    if (error || !data) throw new Error(`load products failed: ${error?.message}`)
    return Object.fromEntries(data.map((p) => [p.slug, p.id]))
  }

  async loadCreativeResults(campaignId: string): Promise<CreativeResult[]> {
    const { data: assets, error } = await this.db
      .from('assets')
      .select('id, product_id, aspect_ratio, storage_path, source, width, height')
      .eq('campaign_id', campaignId)
      .eq('kind', 'creative')
    if (error || !assets) throw new Error(`load creatives failed: ${error?.message}`)
    if (assets.length === 0) return []

    const productIds = [
      ...new Set(assets.map((a) => a.product_id).filter((id): id is string => !!id)),
    ]
    const { data: products } = await this.db
      .from('products')
      .select('id, name, slug')
      .in('id', productIds)
    const productMap = new Map((products ?? []).map((p) => [p.id, p]))

    const { data: compliance } = await this.db
      .from('compliance_results')
      .select('asset_id, check, status, detail')
      .in(
        'asset_id',
        assets.map((a) => a.id),
      )
    const byAsset = new Map<string, ComplianceCheck[]>()
    for (const c of compliance ?? []) {
      const list = byAsset.get(c.asset_id) ?? []
      list.push({ check: c.check, status: c.status, detail: c.detail ?? '' })
      byAsset.set(c.asset_id, list)
    }

    return assets.map((a) => {
      const product = a.product_id ? productMap.get(a.product_id) : undefined
      return {
        productName: product?.name ?? 'Unknown',
        productSlug: product?.slug ?? 'unknown',
        ratio: (a.aspect_ratio ?? '1:1') as AspectRatio,
        source: (a.source ?? 'generated') as 'reused' | 'generated',
        storagePath: a.storage_path,
        assetId: a.id,
        width: a.width ?? 0,
        height: a.height ?? 0,
        compliance: byAsset.get(a.id) ?? [],
      }
    })
  }
}
