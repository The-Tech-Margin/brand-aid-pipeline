import { describe, it, expect } from 'vitest'
import { canvasSizeForRatio, fitScale, dataUrlToBase64, defaultTextColor } from './scene'

describe('canvasSizeForRatio', () => {
  it('returns the compositor dimensions for each ratio', () => {
    expect(canvasSizeForRatio('1:1')).toEqual({ width: 1080, height: 1080 })
    expect(canvasSizeForRatio('9:16')).toEqual({ width: 1080, height: 1920 })
    expect(canvasSizeForRatio('16:9')).toEqual({ width: 1920, height: 1080 })
  })
})

describe('fitScale', () => {
  it('scales a large canvas down to fit and never upscales', () => {
    expect(fitScale({ width: 1080, height: 1080 }, 540, 540)).toBe(0.5)
    expect(fitScale({ width: 100, height: 100 }, 540, 540)).toBe(1)
  })
})

describe('dataUrlToBase64', () => {
  it('strips a data-URL prefix and passes through bare base64', () => {
    expect(dataUrlToBase64('data:image/png;base64,AAAB')).toBe('AAAB')
    expect(dataUrlToBase64('AAAB')).toBe('AAAB')
  })
})

describe('defaultTextColor', () => {
  it('prefers the first brand color, else near-black', () => {
    expect(defaultTextColor(['#E904E5', '#09FFF0'])).toBe('#E904E5')
    expect(defaultTextColor([])).toBe('#111111')
  })
})
