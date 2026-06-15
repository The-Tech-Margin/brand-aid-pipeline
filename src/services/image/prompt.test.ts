import { describe, it, expect } from 'vitest'
import { buildHeroPrompt } from './prompt'
import type { Brief } from '@/features/brief/schema'

const brief = {
  campaign_name: 'Summer Glow',
  products: [],
  target_region: 'Japan',
  target_audience: 'Urban women, 25-40',
  campaign_message: 'Glow that lasts all day',
  aspect_ratios: ['1:1'],
} as unknown as Brief

const product = {
  name: 'HydraBoost Serum',
  description: 'hydrating facial serum',
  input_assets: [],
}

describe('buildHeroPrompt', () => {
  it('composes product, region, audience, and message into the prompt', () => {
    const { prompt } = buildHeroPrompt(brief, product)
    expect(prompt).toContain('HydraBoost Serum')
    expect(prompt).toContain('Japan')
    expect(prompt).toContain('Urban women')
    expect(prompt).toContain('Glow that lasts all day')
  })

  it('keeps text and logos out via the negative prompt', () => {
    const { negativePrompt } = buildHeroPrompt(brief, product)
    expect(negativePrompt).toContain('text')
    expect(negativePrompt).toContain('logo')
  })

  it('folds in the product creative direction when present', () => {
    const withDirection = { ...product, creative_direction: 'Minimal top-down flat-lay' }
    expect(buildHeroPrompt(brief, withDirection).prompt).toContain(
      'Art direction: Minimal top-down flat-lay.',
    )
    expect(buildHeroPrompt(brief, product).prompt).not.toContain('Art direction:')
  })
})
