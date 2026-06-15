// Encode raw PNG bytes as a data URI for @react-pdf/renderer's <Image src>. Data
// URIs are the most reliable cross-version way to embed in-memory images (no fs
// path or format ambiguity), and keep the PDF self-contained.
export function pngDataUri(bytes: Uint8Array): string {
  return `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`
}
