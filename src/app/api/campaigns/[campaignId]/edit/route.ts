// Save-back for a from-scratch design created in the in-app editor — there's no
// source asset, so the client posts the missing product/ratio context. Ownership is
// enforced via RLS reads before the service-role write.
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { createSupabaseAdminClient } from '@/services/supabase/admin'
import { env } from '@/config/env'
import { ASPECT_RATIOS, type AspectRatio } from '@/features/brief/schema'

function asAspectRatio(value: unknown): AspectRatio {
  return ASPECT_RATIOS.includes(value as AspectRatio) ? (value as AspectRatio) : '1:1'
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

  const body = (await request.json().catch(() => null)) as {
    image?: string
    productId?: string
    ratio?: string
  } | null
  const image = typeof body?.image === 'string' ? body.image : null
  if (!image) return NextResponse.json({ error: 'Missing image data' }, { status: 400 })

  // If a product is named, confirm it belongs to this campaign (RLS).
  let productId: string | null = null
  if (typeof body?.productId === 'string') {
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', body.productId)
      .eq('campaign_id', campaignId)
      .maybeSingle()
    productId = product?.id ?? null
  }

  const base64 = image.includes(',') ? image.slice(image.indexOf(',') + 1) : image
  const buffer = Buffer.from(base64, 'base64')
  if (buffer.byteLength === 0) return NextResponse.json({ error: 'Empty image' }, { status: 400 })

  const newPath = `creatives/${campaignId}/edited-${Date.now()}.png`
  const admin = createSupabaseAdminClient()
  const { error: uploadError } = await admin.storage
    .from(env.storageBucket())
    .upload(newPath, buffer, { contentType: 'image/png', upsert: false })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: inserted, error: insertError } = await admin
    .from('assets')
    .insert({
      campaign_id: campaignId,
      product_id: productId,
      kind: 'creative',
      aspect_ratio: asAspectRatio(body?.ratio),
      storage_path: newPath,
      variant: 'edited',
      source: 'generated',
    })
    .select('id')
    .single()
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  return NextResponse.json({ assetId: inserted.id })
}
