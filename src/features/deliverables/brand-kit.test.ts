import { describe, it, expect } from 'vitest'
import { toBrandKit } from './brand-kit'

const base = {
  name: 'Summer Glow',
  message: 'Glow that lasts all day',
  region: 'Japan',
  audience: 'Urban women',
  locale: 'ja-JP' as string | null,
  brand_palette: ['#E904E5', '#09FFF0'] as string[] | null,
}

describe('toBrandKit', () => {
  it('maps palette, primary, and text color from the campaign + framing', () => {
    const kit = toBrandKit(base, { textColor: '#ffffff' })
    expect(kit.campaignName).toBe('Summer Glow')
    expect(kit.palette).toEqual(['#E904E5', '#09FFF0'])
    expect(kit.primary).toBe('#E904E5')
    expect(kit.textColor).toBe('#ffffff')
  })

  it('handles a null palette and missing framing without crashing', () => {
    const kit = toBrandKit({ ...base, brand_palette: null, locale: null })
    expect(kit.palette).toEqual([])
    expect(kit.primary).toBe('#111111')
    expect(kit.textColor).toBe('#111111')
    expect(kit.locale).toBeNull()
  })
})
