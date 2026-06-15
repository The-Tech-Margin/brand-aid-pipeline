// GET — the one-page brand style sheet PDF (palette, logo, type, voice).
import { authorizeCampaign } from '@/features/deliverables/route-helpers'
import { collectCampaignDeliverables, buildBrandSheetPdf } from '@/features/deliverables'
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
  const pdf = await buildBrandSheetPdf({ brand: data.brand, logo: data.logo })
  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${slugify(auth.campaign.name)}-brand-sheet.pdf"`,
    },
  })
}
