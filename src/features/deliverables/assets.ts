// Server-only loaders for deliverable inputs: the brand logo (from public/) and
// creative PNG bytes (downloaded from the private bucket via the admin client).
// Bytes — not signed URLs — so PDFs are self-contained with no render-time fetch.
import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createSupabaseAdminClient } from '@/services/supabase/admin'
import { env } from '@/config/env'

const LOGO_PATH = path.join(process.cwd(), 'public', 'images', 'logo.png')

let logoCache: Buffer | null = null

export async function loadBrandLogo(): Promise<Buffer> {
  if (!logoCache) logoCache = await readFile(LOGO_PATH)
  return logoCache
}

/** Download creative bytes by storage path, keyed by path. Missing files are skipped. */
export async function loadCreativeBytes(storagePaths: string[]): Promise<Map<string, Uint8Array>> {
  const admin = createSupabaseAdminClient()
  const bucket = env.storageBucket()
  const out = new Map<string, Uint8Array>()
  await Promise.all(
    storagePaths.map(async (storagePath) => {
      const { data } = await admin.storage.from(bucket).download(storagePath)
      if (data) out.set(storagePath, new Uint8Array(await data.arrayBuffer()))
    }),
  )
  return out
}
