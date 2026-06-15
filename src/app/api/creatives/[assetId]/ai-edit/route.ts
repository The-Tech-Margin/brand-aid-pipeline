// AI image edit for the in-app editor — routes the current canvas image through the
// Vercel AI Gateway (gpt-image-1 edit) for background removal or a generative
// replace/expand, and returns the edited PNG as a data URI. Ownership is enforced
// via the RLS-scoped read; the gateway call is server-only.
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { GatewayImageClient } from '@/services/image/gateway-client'
import { REMOVE_BG_PROMPT } from '@/services/image/prompt'

export const runtime = 'nodejs'
export const maxDuration = 120

type EditOp = 'remove-bg' | 'generative'

export async function POST(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // RLS: the user can only read assets in their own campaigns.
  const { data: asset } = await supabase.from('assets').select('id').eq('id', assetId).maybeSingle()
  if (!asset) return NextResponse.json({ error: 'Creative not found' }, { status: 404 })

  if (!process.env.AI_GATEWAY_API_KEY) {
    return NextResponse.json({ error: 'AI editing is not configured' }, { status: 503 })
  }

  const body = (await request.json().catch(() => null)) as {
    image?: string
    op?: string
    prompt?: string
  } | null
  const image = typeof body?.image === 'string' ? body.image : null
  const op: EditOp | null = body?.op === 'remove-bg' || body?.op === 'generative' ? body.op : null
  if (!image || !op) return NextResponse.json({ error: 'Missing image or op' }, { status: 400 })
  if (op === 'generative' && !body?.prompt?.trim()) {
    return NextResponse.json(
      { error: 'A prompt is required for generative edits' },
      { status: 400 },
    )
  }

  const base64 = image.includes(',') ? image.slice(image.indexOf(',') + 1) : image
  const bytes = new Uint8Array(Buffer.from(base64, 'base64'))
  if (bytes.byteLength === 0) return NextResponse.json({ error: 'Empty image' }, { status: 400 })

  const prompt = op === 'remove-bg' ? REMOVE_BG_PROMPT : (body?.prompt as string)

  try {
    const result = await new GatewayImageClient('openai').editImage(bytes, { prompt })
    const out = Buffer.from(result.bytes).toString('base64')
    return NextResponse.json({ image: `data:${result.contentType};base64,${out}` })
  } catch (error) {
    console.error('[ai-edit] failed', error)
    return NextResponse.json({ error: 'Image edit failed' }, { status: 502 })
  }
}
