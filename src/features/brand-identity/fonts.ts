// Decorative display-font handling. The chosen Google Fonts family is injected into a
// stylesheet URL AND a CSS custom-property value (see layout.tsx), so it MUST be reduced
// to a safe family token first — letters, numbers, and single spaces only, so no quotes,
// semicolons, or URL/CSS control characters can break out of the declaration.

/** Popular decorative families offered as datalist suggestions. Users may type ANY
 *  Google Fonts family; these are just shortcuts. */
export const POPULAR_DISPLAY_FONTS = [
  'Pacifico',
  'Lobster',
  'Caveat',
  'Dancing Script',
  'Satisfy',
  'Permanent Marker',
  'Righteous',
  'Bungee',
  'Abril Fatface',
  'Poppins',
] as const

/** Reduce arbitrary input to a safe Google Fonts family token, or null if empty. */
export function sanitizeFontFamily(input: string | null | undefined): string | null {
  if (!input) return null
  const cleaned = input
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50)
  return cleaned || null
}

/** Google Fonts stylesheet URL for an already-sanitized family. */
export function googleFontsHref(family: string): string {
  return `https://fonts.googleapis.com/css2?family=${family.trim().replace(/ /g, '+')}:wght@400;700&display=swap`
}
