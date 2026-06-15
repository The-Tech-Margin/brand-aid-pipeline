// Per-ratio creative compositor. Smart-crops the hero master to each aspect ratio,
// overlays the campaign message in the brand font over a contrast scrim, and adds
// brand framing (logo + color bar) on branded/custom skins. Deterministic output.
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ASPECT_DIMENSIONS, type AspectRatio } from '@/features/brief/schema'
import { coverCrop, safeAreaPadding } from './crop'
import { scrimSvg, colorBarSvg, escapePango } from './overlay'

const POPPINS_BOLD = path.join(process.cwd(), 'public', 'fonts', 'Poppins-Bold.ttf')
const LOGO_PATH = path.join(process.cwd(), 'public', 'images', 'logo.png')

let logoCache: Buffer | null = null
async function getBrandLogo(): Promise<Buffer> {
  if (!logoCache) logoCache = await readFile(LOGO_PATH)
  return logoCache
}

export type FramingMode = 'branded' | 'plain' | 'custom'

export interface BrandFraming {
  mode: FramingMode
  /** Brand palette for the bottom color bar; omitted/empty means no bar. */
  barColors?: string[]
  /** Overlay text color (defaults to white for legibility on the scrim). */
  textColor?: string
}

export interface ComposeInput {
  hero: Uint8Array
  ratio: AspectRatio
  message: string
  framing: BrandFraming
}

export interface ComposeResult {
  bytes: Buffer
  width: number
  height: number
  ratio: AspectRatio
}

export async function composeCreative(input: ComposeInput): Promise<ComposeResult> {
  const { width, height } = ASPECT_DIMENSIONS[input.ratio]
  const heroBuf = Buffer.from(input.hero)
  const meta = await sharp(heroBuf).metadata()
  const box = coverCrop(meta.width ?? width, meta.height ?? height, width, height)

  const base = await sharp(heroBuf).extract(box).resize(width, height).toBuffer()

  const layers: sharp.OverlayOptions[] = [
    { input: Buffer.from(scrimSvg(width, height)), left: 0, top: 0 },
  ]

  // Campaign message — brand font, auto-sized to the safe text box.
  const pad = safeAreaPadding(width)
  const textColor = input.framing.textColor ?? '#ffffff'
  const textImg = await sharp({
    text: {
      text: `<span foreground="${textColor}">${escapePango(input.message)}</span>`,
      font: 'Poppins',
      fontfile: POPPINS_BOLD,
      rgba: true,
      width: width - pad * 2,
      height: Math.round(height * 0.22),
      align: 'left',
    },
  })
    .png()
    .toBuffer()
  const textMeta = await sharp(textImg).metadata()
  layers.push({
    input: textImg,
    left: pad,
    top: height - safeAreaPadding(height) - (textMeta.height ?? 0),
  })

  // Brand framing — logo + color bar; omitted entirely on the plain skin.
  if (input.framing.mode !== 'plain') {
    const logoSize = Math.round(width * 0.12)
    const logo = await sharp(await getBrandLogo())
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    layers.push({ input: logo, left: pad, top: safeAreaPadding(height) })

    if (input.framing.barColors?.length) {
      const barHeight = Math.max(6, Math.round(height * 0.014))
      layers.push({
        input: Buffer.from(colorBarSvg(width, barHeight, input.framing.barColors)),
        left: 0,
        top: height - barHeight,
      })
    }
  }

  const bytes = await sharp(base).composite(layers).png().toBuffer()
  return { bytes, width, height, ratio: input.ratio }
}
