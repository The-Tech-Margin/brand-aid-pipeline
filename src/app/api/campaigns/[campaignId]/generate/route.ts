// Text-to-image generation for the in-app editor — lets a NEW design generate a
// background from a prompt, with no source asset. Server-only gateway call; ownership
// enforced via the RLS-scoped campaign read. Save-back still goes through
// /api/campaigns/[campaignId]/edit once the user is happy.
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { GatewayImageClient } from '@/services/image/gateway-client'
import { ASPECT_RATIOS, type AspectRatio } from '@/features/brief/schema'

export const runtime = 'nodejs'
export const maxDuration = 120

// gpt-image-1 only accepts these sizes; map each output ratio to the matching one so
// the generated master has the right proportions for the editor canvas.
const GEN_SIZE: Record<AspectRatio, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '9:16': { width: 1024, height: 1536 },
  '16:9': { width: 1536, height: 1024 },
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> },
) {
  const { campaignId } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // RLS ownership — returns the campaign only to its owner.
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .maybeSingle()
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

  if (!process.env.AI_GATEWAY_API_KEY) {
    return NextResponse.json({ error: 'AI generation is not configured' }, { status: 503 })
  }

  const body = (await request.json().catch(() => null)) as {
    prompt?: string
    ratio?: string
  } | null
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt) return NextResponse.json({ error: 'A prompt is required' }, { status: 400 })
  const ratio: AspectRatio = ASPECT_RATIOS.includes(body?.ratio as AspectRatio)
    ? (body!.ratio as AspectRatio)
    : '1:1'

  try {
    const result = await new GatewayImageClient('openai').generateHero(prompt, GEN_SIZE[ratio])
    const out = Buffer.from(result.bytes).toString('base64')
    return NextResponse.json({ image: `data:${result.contentType};base64,${out}` })
  } catch (error) {
    console.error('[generate] failed', error)
    return NextResponse.json({ error: 'Image generation failed' }, { status: 502 })
  }
}
