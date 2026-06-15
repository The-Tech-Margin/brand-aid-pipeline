// @vitest-environment node
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { composeCreative } from './compositor'
import { ASPECT_RATIOS, ASPECT_DIMENSIONS } from '@/features/brief/schema'

async function synthHero(): Promise<Uint8Array> {
  const buf = await sharp({
    create: { width: 2048, height: 2048, channels: 3, background: { r: 20, g: 120, b: 200 } },
  })
    .png()
    .toBuffer()
  return new Uint8Array(buf)
}

describe('composeCreative', () => {
  it('produces a valid PNG at each aspect ratio with branded framing', async () => {
    const hero = await synthHero()
    for (const ratio of ASPECT_RATIOS) {
      const result = await composeCreative({
        hero,
        ratio,
        message: 'Glow that lasts all day',
        framing: { mode: 'branded', barColors: ['#E904E5', '#09FFF0', '#a1ff00'] },
      })
      const meta = await sharp(result.bytes).metadata()
      expect(meta.format).toBe('png')
      expect(meta.width).toBe(ASPECT_DIMENSIONS[ratio].width)
      expect(meta.height).toBe(ASPECT_DIMENSIONS[ratio].height)
    }
  }, 30_000)

  it('renders the message on the plain skin without brand framing', async () => {
    const hero = await synthHero()
    const result = await composeCreative({
      hero,
      ratio: '1:1',
      message: 'Your best morning',
      framing: { mode: 'plain' },
    })
    const meta = await sharp(result.bytes).metadata()
    expect(meta.width).toBe(1080)
    expect(meta.height).toBe(1080)
  }, 30_000)
})
