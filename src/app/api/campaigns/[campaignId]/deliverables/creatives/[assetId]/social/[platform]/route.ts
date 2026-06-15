// GET — an upload-ready, platform-sized social asset (PNG) for one creative.
import { authorizeCampaign } from '@/features/deliverables/route-helpers'
import { collectCreative, buildSocialPost, isSocialPlatform } from '@/features/deliverables'
import { slugify } from '@/lib/slug'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ campaignId: string; assetId: string; platform: string }> },
): Promise<Response> {
  const { campaignId, assetId, platform } = await params
  if (!isSocialPlatform(platform)) {
    return Response.json({ error: 'Unknown platform' }, { status: 400 })
  }

  const auth = await authorizeCampaign(campaignId)
  if (!auth.ok) return auth.response

  const data = await collectCreative(auth.campaign, assetId)
  if (!data) return Response.json({ error: 'Creative not found' }, { status: 404 })

  const post = await buildSocialPost({
    brand: data.brand,
    creativePng: data.creative.png,
    platform,
  })
  return new Response(new Uint8Array(post.bytes), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${slugify(data.creative.productName)}-${platform}.png"`,
    },
  })
}
