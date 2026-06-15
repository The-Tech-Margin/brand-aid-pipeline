// @vitest-environment node
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { composeCreative } from '@/features/pipeline/compositor/compositor'
import { runComplianceChecks } from './checks'

async function brandHero(): Promise<Uint8Array> {
  const buf = await sharp({
    create: { width: 2048, height: 2048, channels: 3, background: { r: 233, g: 4, b: 229 } },
  })
    .png()
    .toBuffer()
  return new Uint8Array(buf)
}

describe('runComplianceChecks', () => {
  it('passes logo + contrast and detects a brand color on a branded creative', async () => {
    const hero = await brandHero()
    const creative = await composeCreative({
      hero,
      ratio: '1:1',
      message: 'Glow that lasts all day',
      framing: { mode: 'branded', barColors: ['#E904E5', '#09FFF0'] },
    })
    const checks = await runComplianceChecks(creative.bytes, creative.width, creative.height, {
      framingMode: 'branded',
      brandPalette: ['#E904E5', '#09FFF0', '#a1ff00'],
      messageColor: '#ffffff',
    })
    const status = Object.fromEntries(checks.map((c) => [c.check, c.status]))
    expect(status['logo-presence']).toBe('pass')
    expect(status['text-contrast']).not.toBe('fail')
    expect(status['brand-color-usage']).toBe('pass')
  }, 30_000)
})
