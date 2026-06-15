import { describe, it, expect } from 'vitest'
import { coverCrop, safeAreaPadding } from './crop'

describe('coverCrop', () => {
  it('crops a square master to 16:9 by trimming height', () => {
    expect(coverCrop(2048, 2048, 1920, 1080)).toEqual({
      left: 0,
      top: 448,
      width: 2048,
      height: 1152,
    })
  })

  it('crops a square master to 9:16 by trimming width', () => {
    expect(coverCrop(2048, 2048, 1080, 1920)).toEqual({
      left: 448,
      top: 0,
      width: 1152,
      height: 2048,
    })
  })

  it('keeps the full square for 1:1', () => {
    expect(coverCrop(2048, 2048, 1080, 1080)).toEqual({
      left: 0,
      top: 0,
      width: 2048,
      height: 2048,
    })
  })

  it('never exceeds source bounds', () => {
    const box = coverCrop(1000, 500, 1080, 1920)
    expect(box.left).toBeGreaterThanOrEqual(0)
    expect(box.top).toBeGreaterThanOrEqual(0)
    expect(box.width).toBeLessThanOrEqual(1000)
    expect(box.height).toBeLessThanOrEqual(500)
  })
})

describe('safeAreaPadding', () => {
  it('defaults to 8% of the dimension', () => {
    expect(safeAreaPadding(1000)).toBe(80)
  })
})
