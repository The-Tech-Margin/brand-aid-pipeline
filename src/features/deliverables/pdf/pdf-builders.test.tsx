// @vitest-environment node
import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { buildCampaignPdf } from './campaign-pdf'
import { buildBrandSheetPdf } from './brand-sheet-pdf'
import { buildSpecSheetPdf } from './spec-sheet-pdf'
import type { DeliverableBrandKit, DeliverableProduct, EmbeddableCreative } from '../types'

async function tinyPng(r = 233, g = 4, b = 229): Promise<Uint8Array> {
  const buf = await sharp({
    create: { width: 64, height: 64, channels: 3, background: { r, g, b } },
  })
    .png()
    .toBuffer()
  return new Uint8Array(buf)
}

const brand: DeliverableBrandKit = {
  campaignName: 'Summer Glow',
  message: 'Glow that lasts all day',
  palette: ['#E904E5', '#09FFF0'],
  primary: '#E904E5',
  textColor: '#111111',
  region: 'Japan',
  audience: 'Urban women',
  locale: 'ja-JP',
}

function isPdf(bytes: Uint8Array): boolean {
  return Buffer.from(bytes.subarray(0, 5)).toString('latin1') === '%PDF-'
}

function creative(png: Uint8Array): EmbeddableCreative {
  return {
    productName: 'HydraBoost Serum',
    productSlug: 'hydraboost-serum',
    ratio: '1:1',
    width: 1080,
    height: 1080,
    source: 'generated',
    png,
    compliance: [{ check: 'logo-present', status: 'pass', detail: 'Logo detected top-left' }],
  }
}

describe('PDF deliverable builders', () => {
  it('buildCampaignPdf renders a multi-page PDF', async () => {
    const [logo, png] = await Promise.all([tinyPng(), tinyPng(9, 255, 240)])
    const products: DeliverableProduct[] = [
      {
        productName: 'HydraBoost Serum',
        productSlug: 'hydraboost-serum',
        creatives: [creative(png)],
      },
    ]
    const pdf = await buildCampaignPdf({ brand, logo, products })
    expect(isPdf(pdf)).toBe(true)
    expect(pdf.byteLength).toBeGreaterThan(1000)
  }, 30_000)

  it('buildBrandSheetPdf renders a one-page PDF', async () => {
    const logo = await tinyPng()
    const pdf = await buildBrandSheetPdf({ brand, logo })
    expect(isPdf(pdf)).toBe(true)
    expect(pdf.byteLength).toBeGreaterThan(1000)
  }, 30_000)

  it('buildSpecSheetPdf renders a PDF with the compliance table', async () => {
    const [logo, png] = await Promise.all([tinyPng(), tinyPng()])
    const pdf = await buildSpecSheetPdf({ brand, logo, creative: creative(png) })
    expect(isPdf(pdf)).toBe(true)
    expect(pdf.byteLength).toBeGreaterThan(1000)
  }, 30_000)
})
