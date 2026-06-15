// Theme system constants — two orthogonal axes (theme skin x light/dark mode)
// plus the editable token shape used by the custom theme builder.

export const THEMES = ['branded', 'plain', 'custom'] as const
export type ThemeName = (typeof THEMES)[number]

export const MODES = ['light', 'dark'] as const
export type Mode = (typeof MODES)[number]

export const THEME_COOKIE = 'bh-theme'
export const MODE_COOKIE = 'bh-mode'
/** Stores the active custom theme id so SSR restores the right one flash-free. */
export const CUSTOM_COOKIE = 'bh-custom'

export const DEFAULT_THEME: ThemeName = 'branded'
export const DEFAULT_MODE: Mode = 'dark'

/** Synthetic id + settings key for the admin-set, app-wide default theme. */
export const GLOBAL_THEME_ID = 'global'
export const GLOBAL_THEME_KEY = 'global_theme'

/** Editable design tokens for one mode of a theme. Hex/length strings (CSS values). */
export interface ThemeTokens {
  background: string
  foreground: string
  card: string
  muted: string
  mutedForeground: string
  border: string
  primary: string
  primaryForeground: string
  // Secondary/tertiary accent colors + the text that sits on them. Optional so themes
  // saved/exported before these existed still parse (they fall back to the skin default).
  secondary?: string
  secondaryForeground?: string
  tertiary?: string
  tertiaryForeground?: string
  brandPink: string
  brandLime: string
  brandCyan: string
  brandHotRed: string
  brandGoldenrod: string
  radius: string
}

/** A user-authored theme: a name plus a full token set for each mode. */
export interface CustomTheme {
  id: string
  name: string
  light: ThemeTokens
  dark: ThemeTokens
}

/** Maps a ThemeTokens field to the CSS custom property it drives. */
export const TOKEN_TO_CSS_VAR: Record<keyof ThemeTokens, string> = {
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  border: '--border',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  tertiary: '--tertiary',
  tertiaryForeground: '--tertiary-foreground',
  brandPink: '--brand-pink',
  brandLime: '--brand-lime',
  brandCyan: '--brand-cyan',
  brandHotRed: '--brand-hot-red',
  brandGoldenrod: '--brand-goldenrod',
  radius: '--radius',
}

export function isThemeName(value: string | undefined): value is ThemeName {
  return value === 'branded' || value === 'plain' || value === 'custom'
}

export function isMode(value: string | undefined): value is Mode {
  return value === 'light' || value === 'dark'
}
