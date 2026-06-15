import { describe, it, expect } from 'vitest'
import { hexToRgb, contrastRatio, colorDistance } from './color'

describe('hexToRgb', () => {
  it('parses 6- and 3-digit hex', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 })
    expect(hexToRgb('#E904E5')).toEqual({ r: 233, g: 4, b: 229 })
  })
})

describe('contrastRatio', () => {
  it('is 21:1 for white on black', () => {
    expect(Math.round(contrastRatio(hexToRgb('#fff'), hexToRgb('#000')))).toBe(21)
  })

  it('is 1:1 for identical colors', () => {
    expect(contrastRatio(hexToRgb('#777'), hexToRgb('#777'))).toBeCloseTo(1)
  })

  it('passes AA for white on brand dark surface', () => {
    expect(contrastRatio(hexToRgb('#ffffff'), hexToRgb('#0a0a0a'))).toBeGreaterThan(4.5)
  })
})

describe('colorDistance', () => {
  it('is zero for identical colors', () => {
    expect(colorDistance({ r: 1, g: 2, b: 3 }, { r: 1, g: 2, b: 3 })).toBe(0)
  })
})
