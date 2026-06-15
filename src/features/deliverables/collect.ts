// Server-only assembly of deliverable inputs. Routes verify campaign ownership via
// the RLS client first, then hand the verified campaign here; this reads assets +
// products + compliance with the admin client and downloads creative bytes. Keeps
// the PDF/asset builders pure (they receive plain data + bytes).
import 'server-only'
import { createSupabaseAdminClient } from '@/services/supabase/admin'
import { loadBrandLogo, loadCreativeBytes } from './assets'
import { toBrandKit } from './brand-kit'
import type { CampaignRow } from '@/types/database'
import type { AspectRatio } from '@/features/brief/schema'
import type { ComplianceCheck, ComplianceStatus } from '@/features/pipeline/compliance/types'
import type { DeliverableBrandKit, DeliverableProduct, EmbeddableCreative } from './types'

export type CampaignBrandFields = Pick<
  CampaignRow,
  'id' | 'name' | 'message' | 'region' | 'audience' | 'locale' | 'brand_palette'
>

export interface CampaignDeliverables {
  brand: DeliverableBrandKit
  logo: Uint8Array
  products: DeliverableProduct[]
}

export async function collectCampaignDeliverables(
  campaign: CampaignBrandFields,
): Promise<CampaignDeliverables> {
  const admin = createSupabaseAdminClient()
  const { data: assets } = await admin
    .from('assets')
    .select('id, product_id, aspect_ratio, storage_path, source, width, height')
    .eq('campaign_id', campaign.id)
    .eq('kind', 'creative')
  const list = assets ?? []

  const productIds = [...new Set(list.map((a) => a.product_id).filter((x): x is string => !!x))]
  const assetIds = list.map((a) => a.id)
  const [{ data: products }, { data: complianceRows }, logo, bytesByPath] = await Promise.all([
    admin.from('products').select('id, name, slug').in('id', productIds),
    admin
      .from('compliance_results')
      .select('asset_id, check, status, detail')
      .in('asset_id', assetIds),
    loadBrandLogo(),
    loadCreativeBytes(list.map((a) => a.storage_path)),
  ])
  const productMap = new Map((products ?? []).map((p) => [p.id, p]))
  const complianceByAsset = new Map<string, ComplianceCheck[]>()
  for (const c of complianceRows ?? []) {
    const arr = complianceByAsset.get(c.asset_id) ?? []
    arr.push({ check: c.check, status: c.status as ComplianceStatus, detail: c.detail ?? '' })
    complianceByAsset.set(c.asset_id, arr)
  }

  const byProduct = new Map<string, DeliverableProduct>()
  for (const a of list) {
    const png = bytesByPath.get(a.storage_path)
    if (!png) continue
    const product = a.product_id ? productMap.get(a.product_id) : undefined
    const slug = product?.slug ?? 'unknown'
    const name = product?.name ?? 'Unknown'
    const group = byProduct.get(slug) ?? { productName: name, productSlug: slug, creatives: [] }
    group.creatives.push({
      productName: name,
      productSlug: slug,
      ratio: (a.aspect_ratio ?? '1:1') as AspectRatio,
      width: a.width,
      height: a.height,
      source: a.source ?? 'generated',
      png,
      compliance: complianceByAsset.get(a.id) ?? [],
    })
    byProduct.set(slug, group)
  }

  return { brand: toBrandKit(campaign), logo, products: [...byProduct.values()] }
}

export interface CreativeDeliverable {
  brand: DeliverableBrandKit
  logo: Uint8Array
  creative: EmbeddableCreative
}

/** Assemble one creative (with compliance) for a spec sheet / social export. */
export async function collectCreative(
  campaign: CampaignBrandFields,
  assetId: string,
): Promise<CreativeDeliverable | null> {
  const admin = createSupabaseAdminClient()
  const { data: asset } = await admin
    .from('assets')
    .select('id, product_id, aspect_ratio, storage_path, source, width, height')
    .eq('id', assetId)
    .eq('campaign_id', campaign.id)
    .eq('kind', 'creative')
    .maybeSingle()
  if (!asset) return null

  const [logo, bytesByPath, productRes, complianceRes] = await Promise.all([
    loadBrandLogo(),
    loadCreativeBytes([asset.storage_path]),
    asset.product_id
      ? admin.from('products').select('name, slug').eq('id', asset.product_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from('compliance_results').select('check, status, detail').eq('asset_id', asset.id),
  ])

  const png = bytesByPath.get(asset.storage_path)
  if (!png) return null

  const compliance: ComplianceCheck[] = (complianceRes.data ?? []).map((c) => ({
    check: c.check,
    status: c.status as ComplianceStatus,
    detail: c.detail ?? '',
  }))

  const creative: EmbeddableCreative = {
    productName: productRes.data?.name ?? 'Unknown',
    productSlug: productRes.data?.slug ?? 'unknown',
    ratio: (asset.aspect_ratio ?? '1:1') as AspectRatio,
    width: asset.width,
    height: asset.height,
    source: asset.source ?? 'generated',
    png,
    compliance,
  }

  const brandKit: DeliverableBrandKit = toBrandKit(campaign)
  return { brand: brandKit, logo, creative }
}
