// Pure editor geometry/helpers — no React, no Konva, so they unit-test directly.
import { ASPECT_DIMENSIONS, type AspectRatio } from '@/features/brief/schema'

export interface CanvasSize {
  width: number
  height: number
}

/** Full-resolution canvas for a ratio (matches the compositor's output dimensions). */
export function canvasSizeForRatio(ratio: AspectRatio): CanvasSize {
  return ASPECT_DIMENSIONS[ratio]
}

/** Scale factor to fit a canvas within max on-screen bounds (never upscales). */
export function fitScale(canvas: CanvasSize, maxWidth: number, maxHeight: number): number {
  return Math.min(maxWidth / canvas.width, maxHeight / canvas.height, 1)
}

/** Strip a data-URL prefix down to the bare base64 payload for the save endpoint. */
export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : dataUrl
}

/** Default fill for a new text node — first brand color, else near-black. */
export function defaultTextColor(palette: string[]): string {
  return palette[0] ?? '#111111'
}
