// @vitest-environment node
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { runCampaign } from './run-campaign'
import type { PipelinePersistence, RunEvent, RunTotals, SaveCreativeArgs } from './types'
import type { ImageGenerator } from '@/services/image/types'
import type { ComplianceCheck } from '@/features/pipeline/compliance/types'
import type { RunStatus } from '@/types/database'
import { DictionaryTranslator } from '@/features/pipeline/translate/dictionary-translator'
import type { Brief } from '@/features/brief/schema'

async function fakeHero(): Promise<Uint8Array> {
  const buf = await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: { r: 233, g: 4, b: 229 } },
  })
    .png()
    .toBuffer()
  return new Uint8Array(buf)
}

function makeBrief(overrides: Partial<Brief> = {}): Brief {
  return {
    campaign_name: 'Summer Glow',
    products: [
      { name: 'HydraBoost Serum', description: 'serum', input_assets: ['serum-front.png'] },
      { name: 'SunShield SPF50', description: 'sunscreen', input_assets: [] },
    ],
    target_region: 'Japan',
    target_audience: 'Urban women',
    campaign_message: 'Glow that lasts all day',
    locale: 'ja-JP',
    aspect_ratios: ['1:1', '16:9'],
    ...overrides,
  } as Brief
}

class MockPersistence implements PipelinePersistence {
  saved: SaveCreativeArgs[] = []
  events: RunEvent[] = []
  finalized: { status: RunStatus; totals: RunTotals } | null = null

  async createCampaign() {
    return {
      campaignId: 'c1',
      productIds: { 'hydraboost-serum': 'p1', 'sunshield-spf50': 'p2' },
    }
  }
  async createRun() {
    return 'r1'
  }
  async saveCreative(args: SaveCreativeArgs) {
    this.saved.push(args)
    return { assetId: `a${this.saved.length}`, storagePath: `creatives/c1/${args.productSlug}` }
  }
  async saveComplianceResults(_assetId: string, _checks: ComplianceCheck[]) {}
  async saveEvents(_runId: string, events: RunEvent[]) {
    this.events.push(...events)
  }
  async finalizeRun(_runId: string, status: RunStatus, totals: RunTotals) {
    this.finalized = { status, totals }
  }
  async loadInputAsset(_campaignId: string, path: string) {
    return path === 'serum-front.png' ? await fakeHero() : null
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

const okImageGen: ImageGenerator = {
  async generateHero() {
    return { bytes: await fakeHero(), contentType: 'image/png', width: 1024, height: 1024 }
  },
}

describe('runCampaign', () => {
  it('reuses available assets, generates missing ones, composites every ratio, localizes', async () => {
    const persistence = new MockPersistence()
    const result = await runCampaign(makeBrief(), {
      userId: 'u1',
      imageGenerator: okImageGen,
      translator: new DictionaryTranslator(),
      persistence,
      framing: { mode: 'branded', barColors: ['#E904E5'] },
      brandPalette: ['#E904E5'],
    })

    expect(result.status).toBe('succeeded')
    expect(result.creatives).toHaveLength(4)
    expect(
      result.creatives
        .filter((c) => c.productSlug === 'hydraboost-serum')
        .every((c) => c.source === 'reused'),
    ).toBe(true)
    expect(
      result.creatives
        .filter((c) => c.productSlug === 'sunshield-spf50')
        .every((c) => c.source === 'generated'),
    ).toBe(true)
    expect(result.totals.localized).toBe(true)
    expect(result.totals.reused).toBe(1)
    expect(result.totals.generated).toBe(1)
    expect(persistence.finalized?.status).toBe('succeeded')
    expect(result.events.length).toBeGreaterThan(0)
  }, 60_000)

  it('records the failure but keeps going when one product errors', async () => {
    const persistence = new MockPersistence()
    const flakyImageGen: ImageGenerator = {
      async generateHero() {
        throw new Error('image generation unavailable')
      },
    }
    const brief = makeBrief({
      products: [
        { name: 'Generated One', description: 'x', input_assets: [] },
        { name: 'Reused One', description: 'y', input_assets: ['serum-front.png'] },
      ],
      locale: undefined,
      aspect_ratios: ['1:1'],
    })
    const result = await runCampaign(brief, {
      userId: 'u1',
      imageGenerator: flakyImageGen,
      translator: new DictionaryTranslator(),
      persistence,
      framing: { mode: 'plain' },
      brandPalette: [],
    })

    expect(result.failedProducts.map((f) => f.product)).toContain('Generated One')
    expect(result.creatives.some((c) => c.productName === 'Reused One')).toBe(true)
    expect(result.status).toBe('succeeded')
  }, 60_000)
})
