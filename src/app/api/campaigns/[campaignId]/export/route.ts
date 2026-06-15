// GET /api/campaigns/[campaignId]/export — stream a ZIP of every creative (mirroring
// the creatives/{product_slug}/{ratio}/{variant}.png layout) plus a deliverables/
// folder of branded PDFs + social assets. Ownership is verified with the RLS client
// before the private bucket is read via the admin client.
import { Readable } from 'node:stream'
import * as archiverModule from 'archiver'

// archiver ships as a CommonJS `export =` callable; bind it to a typed factory so
// it composes cleanly with ESM + bundler module resolution.
const createArchive = archiverModule as unknown as (
  format: string,
  options?: archiverModule.ArchiverOptions,
) => archiverModule.Archiver
import { createSupabaseServerClient } from '@/services/supabase/server'
import { createSupabaseAdminClient } from '@/services/supabase/admin'
import { env } from '@/config/env'
import { slugify } from '@/lib/slug'
import { ratioPathSegment } from '@/features/brief/schema'
import {
  collectCampaignDeliverables,
  buildCampaignPdf,
  buildBrandSheetPdf,
  buildSpecSheetPdf,
  buildSocialPost,
} from '@/features/deliverables'

export const runtime = 'nodejs'
// PDF rendering + per-creative social assets add real CPU work to this route.
export const maxDuration = 120

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ campaignId: string }> },
): Promise<Response> {
  const { campaignId } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Ownership check — RLS returns the row only if the user owns the campaign.
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name, message, region, audience, locale, brand_palette')
    .eq('id', campaignId)
    .single()
  if (!campaign) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data: assets } = await supabase
    .from('assets')
    .select('storage_path')
    .eq('campaign_id', campaignId)
    .eq('kind', 'creative')
  if (!assets || assets.length === 0) {
    return Response.json({ error: 'No creatives to export' }, { status: 404 })
  }

  const admin = createSupabaseAdminClient()
  const bucket = env.storageBucket()
  const archive = createArchive('zip', { zlib: { level: 0 } }) // PNGs are already compressed

  for (const asset of assets) {
    const { data, error } = await admin.storage.from(bucket).download(asset.storage_path)
    if (error || !data) continue
    const buf = Buffer.from(await data.arrayBuffer())
    archive.append(buf, { name: asset.storage_path.replace(`creatives/${campaignId}/`, '') })
  }

  // Branded deliverables — campaign PDF + brand sheet, plus a spec sheet and an
  // Instagram-square social post per creative. Other platforms are available via the
  // standalone /deliverables routes to keep this bundle bounded.
  const deliverables = await collectCampaignDeliverables(campaign)
  if (deliverables.products.length > 0) {
    const [campaignPdf, brandSheet] = await Promise.all([
      buildCampaignPdf(deliverables),
      buildBrandSheetPdf({ brand: deliverables.brand, logo: deliverables.logo }),
    ])
    archive.append(Buffer.from(campaignPdf), { name: 'deliverables/campaign.pdf' })
    archive.append(Buffer.from(brandSheet), { name: 'deliverables/brand-style-sheet.pdf' })

    for (const product of deliverables.products) {
      for (const creative of product.creatives) {
        const stem = `${creative.productSlug}-${ratioPathSegment(creative.ratio)}`
        const spec = await buildSpecSheetPdf({
          brand: deliverables.brand,
          logo: deliverables.logo,
          creative,
        })
        archive.append(Buffer.from(spec), { name: `deliverables/spec-sheets/${stem}.pdf` })

        const social = await buildSocialPost({
          brand: deliverables.brand,
          creativePng: creative.png,
          platform: 'instagram-square',
        })
        archive.append(social.bytes, { name: `deliverables/social/${stem}-instagram-square.png` })
      }
    }
  }

  void archive.finalize()

  const body = Readable.toWeb(archive) as unknown as ReadableStream<Uint8Array>
  return new Response(body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${slugify(campaign.name)}-creatives.zip"`,
    },
  })
}
