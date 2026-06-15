// SVG builders for the contrast scrim and brand color bar. Shapes only (no text),
// so they render reliably without font dependencies and are easy to unit-test.

/** Bottom-anchored darkening gradient that keeps overlaid text legible. */
export function scrimSvg(width: number, height: number): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.45" stop-color="#030729" stop-opacity="0" />
      <stop offset="1" stop-color="#030729" stop-opacity="0.74" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#scrim)" />
</svg>`
}

/** Horizontal brand color bar split evenly across the supplied colors. */
export function colorBarSvg(width: number, barHeight: number, colors: string[]): string {
  const segment = width / colors.length
  const rects = colors
    .map(
      (color, i) =>
        `<rect x="${i * segment}" y="0" width="${segment}" height="${barHeight}" fill="${color}" />`,
    )
    .join('')
  return `<svg width="${width}" height="${barHeight}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`
}

/** Escape user text for safe inclusion in Pango markup. */
export function escapePango(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
