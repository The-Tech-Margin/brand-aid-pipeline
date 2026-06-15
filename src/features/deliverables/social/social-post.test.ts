// @vitest-environment node
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { buildSocialPost } from './social-post'
import { SOCIAL_PLATFORM_IDS, SOCIAL_PLATFORMS } from './platforms'
import type { DeliverableBrandKit } from '../types'

const brand: DeliverableBrandKit = {
  campaignName: 'Summer Glow',
  message: 'Glow on',
  palette: ['#E904E5', '#09FFF0'],
  primary: '#E904E5',
  textColor: '#111111',
  region: 'Japan',
  audience: 'Urban women',
  locale: null,
}

async function creativePng(): Promise<Uint8Array> {
  const buf = await sharp({
    create: { width: 1080, height: 1080, channels: 3, background: { r: 233, g: 4, b: 229 } },
  })
    .png()
    .toBuffer()
  return new Uint8Array(buf)
}

describe('buildSocialPost', () => {
  it.each(SOCIAL_PLATFORM_IDS)(
    'produces an exact %s canvas with the brand bar',
    async (platform) => {
      const png = await creativePng()
      const result = await buildSocialPost({ brand, creativePng: png, platform })
      expect(result.platform).toBe(platform)
      const meta = await sharp(result.bytes).metadata()
      expect(meta.width).toBe(SOCIAL_PLATFORMS[platform].width)
      expect(meta.height).toBe(SOCIAL_PLATFORMS[platform].height)
    },
    30_000,
  )

  it('still produces output when the palette is empty (no bar)', async () => {
    const png = await creativePng()
    const result = await buildSocialPost({
      brand: { ...brand, palette: [] },
      creativePng: png,
      platform: 'facebook-feed',
    })
    const meta = await sharp(result.bytes).metadata()
    expect(meta.width).toBe(1200)
    expect(meta.height).toBe(630)
  }, 30_000)
})
