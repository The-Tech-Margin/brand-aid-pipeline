// @vitest-environment node
// CI smoke test: drive every shipped example brief through the real pipeline with
// fakes (no Supabase, no AI Gateway) to prove each one still produces a full set of
// creatives across both the reuse and generate paths and localizes its overlay.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { parseBrief } from '@/features/brief/parse'
import { runCampaign } from './run-campaign'
import type { PipelinePersistence, RunEvent, RunTotals, SaveCreativeArgs } from './types'
import type { ImageGenerator } from '@/services/image/types'
import type { ComplianceCheck } from '@/features/pipeline/compliance/types'
import type { RunStatus } from '@/types/database'
import { DictionaryTranslator } from '@/features/pipeline/translate/dictionary-translator'
import { slugify } from '@/lib/slug'
import type { Brief } from '@/features/brief/schema'

// Canonical JSON briefs; their YAML twins are proven equivalent by examples.test.ts,
// so running the JSON set here covers both without doubling the (sharp) composite work.
const EXAMPLE_FILES = ['brief.summer-glow.json', 'brief.morning-fuel.json'] as const

async function fakeHero(): Promise<Uint8Array> {
  const buf = await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: { r: 233, g: 4, b: 229 } },
  })
    .png()
    .toBuffer()
  return new Uint8Array(buf)
}

const imageGenerator: ImageGenerator = {
  async generateHero() {
    return { bytes: await fakeHero(), contentType: 'image/png', width: 1024, height: 1024 }
  },
}

// Any referenced input asset resolves to a hero (reuse path); a product with no
// assets falls through to generation. Mirrors the seeded bucket without Supabase.
class FakePersistence implements PipelinePersistence {
  saved: SaveCreativeArgs[] = []
  constructor(private readonly brief: Brief) {}

  async createCampaign() {
    const productIds = Object.fromEntries(
      this.brief.products.map((p, i) => [slugify(p.name), `p${i + 1}`]),
    )
    return { campaignId: 'c1', productIds }
  }
  async createRun() {
    return 'r1'
  }
  async saveCreative(args: SaveCreativeArgs) {
    this.saved.push(args)
    return { assetId: `a${this.saved.length}`, storagePath: `creatives/c1/${args.productSlug}` }
  }
  async saveComplianceResults(_assetId: string, _checks: ComplianceCheck[]) {}
  async saveEvents(_runId: string, _events: RunEvent[]) {}
  async finalizeRun(_runId: string, _status: RunStatus, _totals: RunTotals) {}
  async loadInputAsset(_campaignId: string, assetPath: string) {
    return assetPath ? await fakeHero() : null
  }
  // Chunked-execution methods — unused by the inline runCampaign path under test.
  async getRunState() {
    return null
  }
  async advanceRunCursor() {}
  async loadProductIds() {
    return {}
  }
  async loadCreativeResults() {
    return []
  }
}

function loadBrief(file: string): Brief {
  const parsed = parseBrief(readFileSync(path.join(process.cwd(), 'examples', file), 'utf8'))
  if (!parsed.ok || !parsed.brief) {
    throw new Error(`Invalid example ${file}: ${parsed.errors?.join('; ')}`)
  }
  return parsed.brief
}

describe('shipped example briefs run end-to-end', () => {
  it.each(EXAMPLE_FILES)(
    '%s produces creatives via reuse + generate',
    async (file) => {
      const brief = loadBrief(file)
      const result = await runCampaign(brief, {
        userId: 'u1',
        imageGenerator,
        translator: new DictionaryTranslator(),
        persistence: new FakePersistence(brief),
        framing: { mode: 'branded', barColors: brief.brand_palette ?? [] },
        brandPalette: brief.brand_palette ?? [],
      })

      expect(result.status).toBe('succeeded')
      expect(result.failedProducts).toEqual([])
      expect(result.creatives).toHaveLength(brief.products.length * brief.aspect_ratios.length)
      expect(result.creatives.some((c) => c.source === 'reused')).toBe(true)
      expect(result.creatives.some((c) => c.source === 'generated')).toBe(true)
      // Both shipped examples set a locale whose message is in the seed dictionary.
      expect(result.totals.localized).toBe(true)
    },
    60_000,
  )
})
