// Creative browser read layer — groups a campaign's creatives by product → ratio
// and mints signed URLs for each. RLS-scoped read; admin client only mints URLs.
import 'server-only'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { signCreativeUrls } from '@/services/supabase/storage'
import { ASPECT_RATIOS, type AspectRatio } from '@/features/brief/schema'
import type { AssetSource } from '@/types/database'

export interface CreativeItem {
  assetId: string
  productSlug: string
  productName: string
  ratio: AspectRatio
  source: AssetSource
  /** Asset variant marker, e.g. 'edited' for in-app editor output. */
  variant: string | null
  width: number | null
  height: number | null
  createdAt: string | null
  signedUrl: string
}

export interface ProductCreatives {
  productName: string
  productSlug: string
  ratios: { ratio: AspectRatio; items: CreativeItem[] }[]
}

/** Brand assets passed into the in-app editor so edits stay on-brand. */
export interface CampaignBrandKit {
  palette: string[]
  logoUrl: string
}

export interface CampaignCreatives {
  campaignName: string
  brandKit: CampaignBrandKit
  products: ProductCreatives[]
}

const LOGO_URL = '/images/logo.png'

export async function getCampaignCreatives(campaignId: string): Promise<CampaignCreatives | null> {
  const supabase = await createSupabaseServerClient()
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('name, brand_palette')
    .eq('id', campaignId)
    .single()
  if (!campaign) return null

  const brandKit: CampaignBrandKit = {
    palette: campaign.brand_palette ?? [],
    logoUrl: LOGO_URL,
  }

  const { data: assets } = await supabase
    .from('assets')
    .select(
      'id, product_id, aspect_ratio, storage_path, source, variant, width, height, created_at',
    )
    .eq('campaign_id', campaignId)
    .eq('kind', 'creative')
  if (!assets || assets.length === 0) {
    return { campaignName: campaign.name, brandKit, products: [] }
  }

  const productIds = [...new Set(assets.map((a) => a.product_id).filter((x): x is string => !!x))]
  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug')
    .in('id', productIds)
  const productMap = new Map((products ?? []).map((p) => [p.id, p]))
  const signed = await signCreativeUrls(assets.map((a) => a.storage_path))

  const byProduct = new Map<string, Map<AspectRatio, CreativeItem[]>>()
  const names = new Map<string, string>()
  for (const a of assets) {
    const product = a.product_id ? productMap.get(a.product_id) : undefined
    const slug = product?.slug ?? 'unknown'
    names.set(slug, product?.name ?? 'Unknown')
    const ratio = (a.aspect_ratio ?? '1:1') as AspectRatio
    const ratioMap = byProduct.get(slug) ?? new Map<AspectRatio, CreativeItem[]>()
    const list = ratioMap.get(ratio) ?? []
    list.push({
      assetId: a.id,
      productSlug: slug,
      productName: names.get(slug)!,
      ratio,
      source: (a.source ?? 'generated') as AssetSource,
      variant: a.variant,
      width: a.width,
      height: a.height,
      createdAt: a.created_at ?? null,
      signedUrl: signed.get(a.storage_path) ?? '',
    })
    ratioMap.set(ratio, list)
    byProduct.set(slug, ratioMap)
  }

  const productsOut: ProductCreatives[] = [...byProduct.entries()].map(([slug, ratioMap]) => ({
    productName: names.get(slug)!,
    productSlug: slug,
    ratios: ASPECT_RATIOS.filter((r) => ratioMap.has(r)).map((r) => ({
      ratio: r,
      items: ratioMap.get(r)!,
    })),
  }))

  return { campaignName: campaign.name, brandKit, products: productsOut }
}
