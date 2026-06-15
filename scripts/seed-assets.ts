// Seed the storage bucket with placeholder input assets for every file the example
// briefs reference, so reviewers see the reuse-vs-generate decision immediately.
//   npm run seed
import { loadEnvConfig } from '@next/env'
import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import sharp from 'sharp'
import { parseBrief } from '@/features/brief/parse'
import { createSupabaseAdminClient } from '@/services/supabase/admin'
import { env } from '@/config/env'

loadEnvConfig(process.cwd())

/** A solid brand-blue square so reused creatives are visually distinct from generated. */
async function placeholderPng(): Promise<Buffer> {
  return sharp({
    create: { width: 1024, height: 1024, channels: 3, background: { r: 9, g: 7, b: 41 } },
  })
    .png()
    .toBuffer()
}

async function main() {
  const dir = resolve(process.cwd(), 'examples')
  const files = (await readdir(dir)).filter((f) => /\.(json|ya?ml)$/.test(f))
  const names = new Set<string>()
  for (const f of files) {
    const parsed = parseBrief(await readFile(join(dir, f), 'utf8'))
    if (!parsed.ok || !parsed.brief) continue
    for (const product of parsed.brief.products) {
      for (const asset of product.input_assets) names.add(asset)
    }
  }

  if (names.size === 0) {
    console.log('No input_assets referenced by examples; nothing to seed.')
    return
  }

  const admin = createSupabaseAdminClient()
  const bucket = env.storageBucket()
  const bytes = await placeholderPng()
  for (const name of names) {
    const path = `input-assets/${name}`
    const { error } = await admin.storage
      .from(bucket)
      .upload(path, bytes, { contentType: 'image/png', upsert: true })
    console.log(error ? `✗ ${path}: ${error.message}` : `✓ ${path}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
