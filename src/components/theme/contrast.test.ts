import { describe, it, expect } from 'vitest'
import { contrastRatio, wcagLevel, tokenContrastPairs, worstLevel } from './contrast'
import { THEME_PRESETS } from './presets'

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for identical colors', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5)
  })

  it('is symmetric and parses 3-digit hex', () => {
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(contrastRatio('#000', '#fff'), 5)
  })

  it('returns 1 for unparseable input', () => {
    expect(contrastRatio('not-a-color', '#fff')).toBe(1)
  })
})

describe('wcagLevel', () => {
  it('classifies normal vs large text thresholds', () => {
    expect(wcagLevel(7)).toBe('AAA')
    expect(wcagLevel(4.5)).toBe('AA')
    expect(wcagLevel(4.49)).toBe('fail')
    expect(wcagLevel(3, true)).toBe('AA') // 3:1 passes for large text
    expect(wcagLevel(2.9, true)).toBe('fail')
  })
})

describe('preset themes are WCAG-compliant in both modes', () => {
  // Every preset must keep its text legible in light AND dark — the a11y promise of the
  // theme studio. A failing preset here means its tokens need adjusting.
  it.each(THEME_PRESETS.flatMap((p) => [`${p.name} (dark)`, `${p.name} (light)`]))(
    '%s passes WCAG AA on all text pairs',
    (key) => {
      const preset = THEME_PRESETS.find((p) => key.startsWith(p.name))!
      const tokens = key.endsWith('(dark)') ? preset.dark : preset.light
      const pairs = tokenContrastPairs(tokens)
      const failures = pairs.filter((p) => p.level === 'fail')
      expect(
        failures,
        `${key}: ${failures.map((f) => `${f.label} ${f.ratio.toFixed(2)}:1`).join(', ')}`,
      ).toEqual([])
      expect(worstLevel(pairs)).not.toBe('fail')
    },
  )
})
