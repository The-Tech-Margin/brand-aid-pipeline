// Register the brand font with @react-pdf/renderer once per process. The TTF is
// traced into /api/** functions via next.config outputFileTracingIncludes, and read
// from the same process.cwd() path the compositor uses. Idempotent.
import { Font } from '@react-pdf/renderer'
import path from 'node:path'

let registered = false

export function registerDeliverableFonts(): void {
  if (registered) return
  Font.register({
    family: 'Poppins',
    src: path.join(process.cwd(), 'public', 'fonts', 'Poppins-Bold.ttf'),
  })
  // Poppins is the only family; disable @react-pdf's auto-hyphenation so words
  // aren't broken mid-token in headings/captions.
  Font.registerHyphenationCallback((word) => [word])
  registered = true
}
