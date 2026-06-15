// GET — the branded campaign PDF (every creative laid out with brand framing).
// Auth + RLS ownership first, then assemble + render on demand.
import { authorizeCampaign } from '@/features/deliverables/route-helpers'
import { collectCampaignDeliverables, buildCampaignPdf } from '@/features/deliverables'
import { slugify } from '@/lib/slug'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ campaignId: string }> },
): Promise<Response> {
  const { campaignId } = await params
  const auth = await authorizeCampaign(campaignId)
  if (!auth.ok) return auth.response

  const data = await collectCampaignDeliverables(auth.campaign)
  if (data.products.length === 0) {
    return Response.json({ error: 'No creatives to export' }, { status: 404 })
  }

  const pdf = await buildCampaignPdf(data)
  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${slugify(auth.campaign.name)}-campaign.pdf"`,
    },
  })
}
