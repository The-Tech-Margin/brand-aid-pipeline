// Validation for custom theme tokens. These values are injected verbatim into a
// <style> block (see apply.ts), and an admin's global theme is injected for EVERY
// user — so each value must be a safe, self-contained CSS token that cannot break
// out of its declaration. We allow only hex colors and simple length units; anything
// containing ';', '}', or other CSS-control characters is rejected before write and
// re-validated after read.
import { z } from 'zod'
import type { CustomTheme, ThemeTokens } from './constants'

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'Must be a hex color like #1f1f1f')

const cssLength = z
  .string()
  .regex(/^(0|\d{1,3}(\.\d+)?(px|rem|em))$/, 'Must be a length like 8px, 0.5rem, or 0')

export const themeTokensSchema: z.ZodType<ThemeTokens> = z.object({
  background: hexColor,
  foreground: hexColor,
  card: hexColor,
  muted: hexColor,
  mutedForeground: hexColor,
  border: hexColor,
  primary: hexColor,
  primaryForeground: hexColor,
  secondary: hexColor.optional(),
  secondaryForeground: hexColor.optional(),
  tertiary: hexColor.optional(),
  tertiaryForeground: hexColor.optional(),
  brandPink: hexColor,
  brandLime: hexColor,
  brandCyan: hexColor,
  brandHotRed: hexColor,
  brandGoldenrod: hexColor,
  radius: cssLength,
})

export const customThemeSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1, 'Name is required').max(60),
  light: themeTokensSchema,
  dark: themeTokensSchema,
})

/** Builder save payload — id is optional (absent = create a new theme). */
export const saveThemeInputSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().min(1, 'Name is required').max(60),
  light: themeTokensSchema,
  dark: themeTokensSchema,
})
export type SaveThemeInput = z.infer<typeof saveThemeInputSchema>

/** Admin global-theme payload — the same minus any id (it is app-wide, not owned). */
export const globalThemeInputSchema = saveThemeInputSchema.omit({ id: true })
export type GlobalThemeInput = z.infer<typeof globalThemeInputSchema>

/** Strict export/import shape for a theme JSON file: a name + both fully-typed token
 *  sets (no id). Every token is re-validated, so a hand-edited or untrusted file can't
 *  smuggle anything past the builder. */
export const themeFileSchema = globalThemeInputSchema
export type ThemeFile = z.infer<typeof themeFileSchema>

/** Validate an untrusted stored theme (DB row or setting) into a safe CustomTheme. */
export function parseStoredTheme(id: string, name: string, tokens: unknown): CustomTheme | null {
  const candidate = { id, name, ...(tokens && typeof tokens === 'object' ? tokens : {}) }
  const result = customThemeSchema.safeParse(candidate)
  return result.success ? result.data : null
}
