// Preloaded themes shown in the theme studio. Each is a full CustomTheme (light +
// dark token sets) users can apply as-is or fork into their own. Authored from the
// brand palette in globals.css; `mk` fills the shared neutral surfaces so each preset
// only specifies its accent colors.
import type { CustomTheme, ThemeTokens } from './constants'
import { contrastRatio } from './contrast'

type Surfaces = Pick<
  ThemeTokens,
  'background' | 'foreground' | 'card' | 'muted' | 'mutedForeground' | 'border'
>
type Accents = Pick<
  ThemeTokens,
  | 'primary'
  | 'primaryForeground'
  | 'brandPink'
  | 'brandLime'
  | 'brandCyan'
  | 'brandHotRed'
  | 'brandGoldenrod'
>

const DARK_SURFACES: Surfaces = {
  background: '#0a0a0a',
  card: '#161616',
  muted: '#1f1f1f',
  border: '#2a2a2a',
  mutedForeground: '#a1a1aa',
  foreground: '#f5f5f5',
}

const LIGHT_SURFACES: Surfaces = {
  background: '#ffffff',
  card: '#fafafa',
  muted: '#f4f4f5',
  border: '#e4e4e7',
  mutedForeground: '#52525b',
  foreground: '#18181b',
}

/** Pick near-black or white text for the best contrast on an accent color. */
function readableOn(bg: string): string {
  return contrastRatio('#0a0a0a', bg) >= contrastRatio('#ffffff', bg) ? '#0a0a0a' : '#ffffff'
}

function tokens(base: Surfaces, radius: string, accents: Accents & Partial<Surfaces>): ThemeTokens {
  return {
    ...base,
    radius,
    ...accents,
    // Secondary/tertiary default to the cyan/lime accents (with auto-contrast text); the
    // builder can override them per theme.
    secondary: accents.brandCyan,
    secondaryForeground: readableOn(accents.brandCyan),
    tertiary: accents.brandLime,
    tertiaryForeground: readableOn(accents.brandLime),
  }
}

function mk(
  id: string,
  name: string,
  opts: {
    radius?: string
    dark: Accents & Partial<Surfaces>
    light: Accents & Partial<Surfaces>
  },
): CustomTheme {
  const radius = opts.radius ?? '0.2rem'
  return {
    id,
    name,
    dark: tokens(DARK_SURFACES, radius, opts.dark),
    light: tokens(LIGHT_SURFACES, radius, opts.light),
  }
}

export const THEME_PRESETS: CustomTheme[] = [
  mk('preset-brand-neon', 'Brand Neon', {
    dark: {
      primary: '#e904e5',
      primaryForeground: '#ffffff',
      brandPink: '#e904e5',
      brandLime: '#a1ff00',
      brandCyan: '#09fff0',
      brandHotRed: '#ff0080',
      brandGoldenrod: '#ff9500',
    },
    light: {
      background: '#f2ede1',
      card: '#fbf8f0',
      muted: '#e7e0d2',
      border: '#d8cfba',
      mutedForeground: '#5c574d',
      foreground: '#2b2a28',
      primary: '#c1248f',
      primaryForeground: '#ffffff',
      brandPink: '#c1248f',
      brandLime: '#5f7d1f',
      brandCyan: '#0a8f86',
      brandHotRed: '#c11f63',
      brandGoldenrod: '#b06a05',
    },
  }),
  mk('preset-sunset', 'Sunset', {
    dark: {
      primary: '#ff6b35',
      primaryForeground: '#1a1a1a',
      brandPink: '#ff3d77',
      brandLime: '#ffd166',
      brandCyan: '#ff9e64',
      brandHotRed: '#ff2d55',
      brandGoldenrod: '#ffb703',
    },
    light: {
      primary: '#e25822',
      primaryForeground: '#ffffff',
      brandPink: '#d6336c',
      brandLime: '#d9a400',
      brandCyan: '#e8722f',
      brandHotRed: '#d6213f',
      brandGoldenrod: '#c98a00',
    },
  }),
  mk('preset-forest', 'Forest', {
    dark: {
      primary: '#4ade80',
      primaryForeground: '#06210f',
      brandPink: '#86efac',
      brandLime: '#bef264',
      brandCyan: '#2dd4bf',
      brandHotRed: '#f87171',
      brandGoldenrod: '#fbbf24',
    },
    light: {
      primary: '#15803d',
      primaryForeground: '#ffffff',
      brandPink: '#16a34a',
      brandLime: '#4d7c0f',
      brandCyan: '#0d9488',
      brandHotRed: '#dc2626',
      brandGoldenrod: '#b45309',
    },
  }),
  mk('preset-ocean', 'Ocean', {
    dark: {
      primary: '#38bdf8',
      primaryForeground: '#06121f',
      brandPink: '#818cf8',
      brandLime: '#22d3ee',
      brandCyan: '#06b6d4',
      brandHotRed: '#fb7185',
      brandGoldenrod: '#fcd34d',
    },
    light: {
      primary: '#0369a1',
      primaryForeground: '#ffffff',
      brandPink: '#4f46e5',
      brandLime: '#0891b2',
      brandCyan: '#0e7490',
      brandHotRed: '#e11d48',
      brandGoldenrod: '#b45309',
    },
  }),
  mk('preset-mono', 'Mono', {
    dark: {
      primary: '#e5e5e5',
      primaryForeground: '#0a0a0a',
      brandPink: '#d4d4d4',
      brandLime: '#a3a3a3',
      brandCyan: '#d4d4d4',
      brandHotRed: '#fafafa',
      brandGoldenrod: '#a3a3a3',
    },
    light: {
      primary: '#171717',
      primaryForeground: '#ffffff',
      brandPink: '#404040',
      brandLime: '#525252',
      brandCyan: '#404040',
      brandHotRed: '#171717',
      brandGoldenrod: '#525252',
    },
  }),
]

/** A fresh draft for the builder — a copy of the Brand Neon preset with a blank id. */
export function draftFromPreset(preset: CustomTheme = THEME_PRESETS[0]!): CustomTheme {
  return { ...preset, id: '', name: '' }
}
