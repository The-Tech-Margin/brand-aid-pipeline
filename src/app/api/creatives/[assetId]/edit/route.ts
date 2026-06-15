// Save-back for the in-app editor — receives the exported image (base64), stores it
// in the private bucket, and records a new creative variant for the same
// campaign/product/ratio. Ownership is enforced by reading the source asset through
// the RLS-scoped server client before the service-role write.
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { createSupabaseAdminClient } from '@/services/supabase/admin'
import { env } from '@/config/env'

export async function POST(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // RLS: the user can only read assets in their own campaigns.
  const { data: asset } = await supabase
    .from('assets')
    .select('id, campaign_id, product_id, aspect_ratio, storage_path')
    .eq('id', assetId)
    .maybeSingle()
  if (!asset) return NextResponse.json({ error: 'Creative not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as { image?: string } | null
  const image = typeof body?.image === 'string' ? body.image : null
  if (!image) return NextResponse.json({ error: 'Missing image data' }, { status: 400 })

  const base64 = image.includes(',') ? image.slice(image.indexOf(',') + 1) : image
  const buffer = Buffer.from(base64, 'base64')
  if (buffer.byteLength === 0) return NextResponse.json({ error: 'Empty image' }, { status: 400 })

  const dir = asset.storage_path.includes('/')
    ? asset.storage_path.slice(0, asset.storage_path.lastIndexOf('/'))
    : 'creatives'
  const newPath = `${dir}/edited-${Date.now()}.png`

  const admin = createSupabaseAdminClient()
  const { error: uploadError } = await admin.storage
    .from(env.storageBucket())
    .upload(newPath, buffer, { contentType: 'image/png', upsert: false })
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: inserted, error: insertError } = await admin
    .from('assets')
    .insert({
      campaign_id: asset.campaign_id,
      product_id: asset.product_id,
      kind: 'creative',
      aspect_ratio: asset.aspect_ratio,
      storage_path: newPath,
      variant: 'edited',
    })
    .select('id')
    .single()
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  return NextResponse.json({ assetId: inserted.id })
}
