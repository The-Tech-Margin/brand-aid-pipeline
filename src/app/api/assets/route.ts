// Input-asset library for the campaign creator.
//   GET  — list the member's uploaded assets + the shared seed assets, with signed
//          thumbnail URLs (the bucket is private; no public paths are ever returned).
//   POST — upload an image to the member's library (multipart "file").
// Both run as the signed-in member but touch storage via the service role, so no
// user-facing storage RLS is required. Uploads land at input-assets/{userId}/{name};
// the pipeline's loadInputAsset resolves that path for the run owner.
import { createSupabaseServerClient } from '@/services/supabase/server'
import { createSupabaseAdminClient } from '@/services/supabase/admin'
import { getMyMembership } from '@/features/members/data'
import { env } from '@/config/env'

export const runtime = 'nodejs'

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

/** Detect the image type from magic bytes — file.type is client-controlled and spoofable. */
function sniffImageType(b: Uint8Array): string | null {
  if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)
    return 'image/png'
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.length >= 4 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38)
    return 'image/gif'
  if (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  )
    return 'image/webp'
  return null
}

/** Strip any path and reduce to a safe, storage-friendly file name. */
function safeName(name: string): string {
  const base = (name.split(/[\\/]/).pop() ?? 'asset').toLowerCase()
  const cleaned = base
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+/, '')
  return cleaned.slice(0, 80) || 'asset'
}

async function activeUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const membership = await getMyMembership()
  return membership?.status === 'active' ? user.id : null
}

export async function GET(): Promise<Response> {
  const userId = await activeUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createSupabaseAdminClient()
  const bucket = env.storageBucket()
  const [mine, shared] = await Promise.all([
    admin.storage.from(bucket).list(`input-assets/${userId}`, { limit: 200 }),
    admin.storage.from(bucket).list('input-assets', { limit: 200 }),
  ])

  // Files only (entries with an id); skip the per-user "folders" the root list returns.
  type Listed = { name: string; path: string; createdAt: string | null; size: number | null }
  const sizeOf = (meta: { size?: unknown } | null): number | null =>
    typeof meta?.size === 'number' ? meta.size : null
  const items: Listed[] = []
  for (const f of mine.data ?? []) {
    if (f.id)
      items.push({
        name: f.name,
        path: `input-assets/${userId}/${f.name}`,
        createdAt: f.created_at ?? null,
        size: sizeOf(f.metadata),
      })
  }
  for (const f of shared.data ?? []) {
    if (f.id && !items.some((i) => i.name === f.name)) {
      items.push({
        name: f.name,
        path: `input-assets/${f.name}`,
        createdAt: f.created_at ?? null,
        size: sizeOf(f.metadata),
      })
    }
  }
  if (items.length === 0) return Response.json({ assets: [] })

  const { data: signed } = await admin.storage.from(bucket).createSignedUrls(
    items.map((i) => i.path),
    3600,
  )
  const assets = items.map((item, idx) => ({
    name: item.name,
    url: signed?.[idx]?.signedUrl ?? null,
    createdAt: item.createdAt,
    size: item.size,
  }))
  return Response.json({ assets })
}

export async function POST(req: Request): Promise<Response> {
  const userId = await activeUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json(
        { error: 'Only PNG, JPEG, WebP, or GIF images are allowed' },
        { status: 400 },
      )
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: 'Image is too large (max 10MB)' }, { status: 400 })
    }

    const name = safeName(file.name)
    const bytes = new Uint8Array(await file.arrayBuffer())
    // Trust the bytes, not the client-declared type.
    const contentType = sniffImageType(bytes)
    if (!contentType) {
      return Response.json({ error: 'File content is not a supported image' }, { status: 400 })
    }

    // Brand logos live in their own prefix so they don't appear in the input-asset library.
    const prefix = form.get('scope') === 'logo' ? 'brand-logos' : 'input-assets'
    const admin = createSupabaseAdminClient()
    const { error } = await admin.storage
      .from(env.storageBucket())
      .upload(`${prefix}/${userId}/${name}`, bytes, { contentType, upsert: true })
    if (error) {
      console.error('[assets] storage error:', error.message)
      return Response.json({ error: 'Upload failed' }, { status: 500 })
    }
    return Response.json({ name }, { status: 201 })
  } catch (err) {
    console.error('[assets] upload error:', err)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
