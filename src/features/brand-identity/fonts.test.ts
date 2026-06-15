// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { sanitizeFontFamily, googleFontsHref } from './fonts'

describe('sanitizeFontFamily', () => {
  it('returns null for empty / missing input', () => {
    expect(sanitizeFontFamily('')).toBeNull()
    expect(sanitizeFontFamily(null)).toBeNull()
    expect(sanitizeFontFamily('   ')).toBeNull()
  })

  it('keeps letters, numbers, and single spaces', () => {
    expect(sanitizeFontFamily('Press Start 2P')).toBe('Press Start 2P')
    expect(sanitizeFontFamily('  Dancing   Script  ')).toBe('Dancing Script')
  })

  it('strips characters that could break out of a URL or CSS declaration', () => {
    expect(sanitizeFontFamily("Evil'; } body{display:none} /*")).toBe('Evil body display none')
    expect(sanitizeFontFamily('Lobster")')).toBe('Lobster')
  })

  it('caps the length', () => {
    expect(sanitizeFontFamily('a'.repeat(80))?.length).toBe(50)
  })
})

describe('googleFontsHref', () => {
  it('builds a css2 URL with + for spaces', () => {
    expect(googleFontsHref('Dancing Script')).toBe(
      'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap',
    )
  })
})
