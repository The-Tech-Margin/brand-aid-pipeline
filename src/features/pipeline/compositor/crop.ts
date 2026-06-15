// Pure cropping geometry — no image library, so it unit-tests directly.

export interface CropBox {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Center "cover" crop: the largest centered region of the source that matches the
 * target aspect ratio, so a resize to (targetW, targetH) fills the frame with no
 * letterboxing or distortion.
 */
export function coverCrop(srcW: number, srcH: number, targetW: number, targetH: number): CropBox {
  const scale = Math.max(targetW / srcW, targetH / srcH)
  const width = Math.min(srcW, Math.round(targetW / scale))
  const height = Math.min(srcH, Math.round(targetH / scale))
  const left = Math.max(0, Math.round((srcW - width) / 2))
  const top = Math.max(0, Math.round((srcH - height) / 2))
  return { left, top, width, height }
}

/** Safe-area inset in pixels for a given dimension (default 8%). */
export function safeAreaPadding(dimension: number, pct = 0.08): number {
  return Math.round(dimension * pct)
}
