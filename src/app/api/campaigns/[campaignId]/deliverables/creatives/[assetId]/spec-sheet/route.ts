// GET — a branded spec sheet PDF for one creative (image + dims/source + compliance).
import { authorizeCampaign } from '@/features/deliverables/route-helpers'
import { collectCreative, buildSpecSheetPdf } from '@/features/deliverables'
import { ratioPathSegment } from '@/features/brief/schema'
import { slugify } from '@/lib/slug'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ campaignId: string; assetId: string }> },
): Promise<Response> {
  const { campaignId, assetId } = await params
  const auth = await authorizeCampaign(campaignId)
  if (!auth.ok) return auth.response

  const data = await collectCreative(auth.campaign, assetId)
  if (!data) return Response.json({ error: 'Creative not found' }, { status: 404 })

  const pdf = await buildSpecSheetPdf({
    brand: data.brand,
    logo: data.logo,
    creative: data.creative,
  })
  const name = `${slugify(data.creative.productName)}-${ratioPathSegment(data.creative.ratio)}-spec.pdf`
  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${name}"`,
    },
  })
}
