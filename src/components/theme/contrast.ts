// WCAG 2.x contrast helpers for the theme studio: every theme must be legible in both
// light and dark mode. Pure functions (no React) so they're unit-testable and reusable
// by the preset compliance test and the live builder indicator.
import type { ThemeTokens } from './constants'

export type WcagLevel = 'AAA' | 'AA' | 'fail'

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return null
  let h = m[1]!
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio (1–21) between two hex colors; 1 if either can't be parsed. */
export function contrastRatio(fg: string, bg: string): number {
  const a = hexToRgb(fg)
  const b = hexToRgb(bg)
  if (!a || !b) return 1
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** AAA ≥ 7 (≥4.5 large), AA ≥ 4.5 (≥3 large), else fail. */
export function wcagLevel(ratio: number, large = false): WcagLevel {
  if (ratio >= (large ? 4.5 : 7)) return 'AAA'
  if (ratio >= (large ? 3 : 4.5)) return 'AA'
  return 'fail'
}

export interface ContrastPair {
  label: string
  ratio: number
  level: WcagLevel
  /** Whether this pair is large text / UI (the 3:1 threshold applies). */
  large: boolean
}

/** The text-legibility pairs that must stay readable within one mode's tokens.
 *  Button text counts as large text (the 3:1 threshold); decorative borders are not
 *  text and are intentionally subtle, so they're not part of the compliance check. */
export function tokenContrastPairs(t: ThemeTokens): ContrastPair[] {
  const pair = (label: string, fg: string, bg: string, large = false): ContrastPair => {
    const ratio = contrastRatio(fg, bg)
    return { label, ratio, level: wcagLevel(ratio, large), large }
  }
  return [
    pair('Body text', t.foreground, t.background),
    pair('Text on cards', t.foreground, t.card),
    pair('Muted text', t.mutedForeground, t.background),
    pair('Primary button', t.primaryForeground, t.primary, true),
  ]
}

/** The worst (lowest) level across a mode's pairs. */
export function worstLevel(pairs: ContrastPair[]): WcagLevel {
  if (pairs.some((p) => p.level === 'fail')) return 'fail'
  if (pairs.some((p) => p.level === 'AA')) return 'AA'
  return 'AAA'
}
