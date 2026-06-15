import { describe, it, expect } from 'vitest'
import {
  themeTokensSchema,
  customThemeSchema,
  parseStoredTheme,
  saveThemeInputSchema,
} from './schema'
import { THEME_PRESETS, draftFromPreset } from './presets'
import { customThemeCss } from './apply'
import type { ThemeTokens } from './constants'

function tokens(overrides: Partial<ThemeTokens> = {}): ThemeTokens {
  return {
    background: '#0a0a0a',
    foreground: '#ffffff',
    card: '#161616',
    muted: '#1f1f1f',
    mutedForeground: '#a1a1aa',
    border: '#2a2a2a',
    primary: '#e904e5',
    primaryForeground: '#ffffff',
    brandPink: '#e904e5',
    brandLime: '#a1ff00',
    brandCyan: '#09fff0',
    brandHotRed: '#ff0080',
    brandGoldenrod: '#ff9500',
    radius: '6px',
    ...overrides,
  }
}

describe('themeTokensSchema', () => {
  it('accepts valid hex colors and length units', () => {
    expect(themeTokensSchema.safeParse(tokens()).success).toBe(true)
    expect(themeTokensSchema.safeParse(tokens({ radius: '0' })).success).toBe(true)
    expect(themeTokensSchema.safeParse(tokens({ radius: '0.5rem' })).success).toBe(true)
    expect(themeTokensSchema.safeParse(tokens({ background: '#abc' })).success).toBe(true)
  })

  // These values are injected into a <style> block (admin global theme → for everyone),
  // so anything that could break out of the declaration must be rejected at the schema.
  it('rejects CSS-injection attempts in a color value', () => {
    expect(
      themeTokensSchema.safeParse(tokens({ background: 'red; } body { display:none' })).success,
    ).toBe(false)
    expect(themeTokensSchema.safeParse(tokens({ primary: '#fff;}</style>' })).success).toBe(false)
    expect(themeTokensSchema.safeParse(tokens({ foreground: 'url(https://x)' })).success).toBe(
      false,
    )
    expect(themeTokensSchema.safeParse(tokens({ card: '#000;background:url(x)' })).success).toBe(
      false,
    )
  })

  it('rejects out-of-range or unsupported radius values', () => {
    expect(themeTokensSchema.safeParse(tokens({ radius: '9999px' })).success).toBe(false)
    expect(themeTokensSchema.safeParse(tokens({ radius: '10vw' })).success).toBe(false)
    expect(themeTokensSchema.safeParse(tokens({ radius: '5px;}' })).success).toBe(false)
  })
})

describe('parseStoredTheme', () => {
  it('returns a CustomTheme for valid stored tokens', () => {
    const theme = parseStoredTheme('t1', 'Mine', { light: tokens(), dark: tokens() })
    expect(theme).not.toBeNull()
    expect(theme?.id).toBe('t1')
    expect(theme?.name).toBe('Mine')
  })

  it('returns null for malformed input so nothing unsafe reaches the DOM', () => {
    expect(
      parseStoredTheme('t1', 'Bad', { light: tokens({ card: '#000;}' }), dark: tokens() }),
    ).toBeNull()
    expect(parseStoredTheme('t1', 'Bad', { light: tokens() })).toBeNull()
    expect(parseStoredTheme('t1', 'Bad', null)).toBeNull()
  })
})

describe('THEME_PRESETS', () => {
  it('every preset is a valid CustomTheme', () => {
    for (const preset of THEME_PRESETS) {
      expect(customThemeSchema.safeParse(preset).success, preset.name).toBe(true)
    }
  })

  it('customThemeCss emits exactly two balanced rule blocks for a preset', () => {
    const css = customThemeCss(THEME_PRESETS[0]!)
    expect(css).toContain('--background:')
    expect(css).toContain('[data-theme="custom"][data-mode="dark"]')
    expect(css).toContain('[data-theme="custom"][data-mode="light"]')
    // A valid theme can never introduce stray braces — only the two rule wrappers.
    expect((css.match(/\{/g) ?? []).length).toBe(2)
    expect((css.match(/\}/g) ?? []).length).toBe(2)
  })
})

describe('draftFromPreset', () => {
  it('clears id and name and keeps valid tokens', () => {
    const draft = draftFromPreset()
    expect(draft.id).toBe('')
    expect(draft.name).toBe('')
    expect(themeTokensSchema.safeParse(draft.dark).success).toBe(true)
    expect(themeTokensSchema.safeParse(draft.light).success).toBe(true)
  })
})

describe('saveThemeInputSchema', () => {
  it('makes id optional but requires a non-empty name', () => {
    expect(
      saveThemeInputSchema.safeParse({ name: 'x', light: tokens(), dark: tokens() }).success,
    ).toBe(true)
    expect(
      saveThemeInputSchema.safeParse({ id: 'abc', name: 'x', light: tokens(), dark: tokens() })
        .success,
    ).toBe(true)
    expect(
      saveThemeInputSchema.safeParse({ name: '', light: tokens(), dark: tokens() }).success,
    ).toBe(false)
  })
})
