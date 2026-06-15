// Signed-URL helper for the private creatives bucket. Server-only: uses the admin
// client to mint short-lived URLs so the browser can render images without the
// bucket ever being public.
import 'server-only'
import { createSupabaseAdminClient } from './admin'
import { env } from '@/config/env'

/** Map of storage path → signed URL. Caller must already own the campaign. */
export async function signCreativeUrls(
  paths: string[],
  expiresIn = 3600,
): Promise<Map<string, string>> {
  const urls = new Map<string, string>()
  if (paths.length === 0) return urls
  const admin = createSupabaseAdminClient()
  const { data } = await admin.storage.from(env.storageBucket()).createSignedUrls(paths, expiresIn)
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) urls.set(item.path, item.signedUrl)
  }
  return urls
}
