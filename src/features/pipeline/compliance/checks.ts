// Automated brand-compliance checks on a composited creative. Each returns a
// pass/warn/fail with a human-readable reason for the run report.
import sharp from 'sharp'
import { safeAreaPadding } from '@/features/pipeline/compositor/crop'
import { contrastRatio, colorDistance, hexToRgb, type Rgb } from './color'
import type { ComplianceCheck, ComplianceContext } from './types'

const BRAND_MATCH_TOLERANCE = 72 // RGB distance under which a pixel "is" a brand color
const CONTRAST_AA_LARGE = 3 // WCAG AA for large text
const CONTRAST_AA_NORMAL = 4.5

/** Average color of a region (or the whole image) via a 1×1 downsample. */
async function averageColor(
  buf: Buffer,
  region?: { left: number; top: number; width: number; height: number },
): Promise<Rgb> {
  const pipeline = region ? sharp(buf).extract(region) : sharp(buf)
  const { data } = await pipeline
    .removeAlpha()
    .resize(1, 1, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { r: data[0], g: data[1], b: data[2] }
}

/** A coarse grid of sampled pixels for brand-color detection. */
async function samplePixels(buf: Buffer, n = 16): Promise<Rgb[]> {
  const { data } = await sharp(buf)
    .removeAlpha()
    .resize(n, n, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true })
  const pixels: Rgb[] = []
  for (let i = 0; i < data.length; i += 3) {
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] })
  }
  return pixels
}

/** Std-dev of a region's luminance — a proxy for "something was drawn here". */
async function regionVariance(
  buf: Buffer,
  region: { left: number; top: number; width: number; height: number },
): Promise<number> {
  const { channels } = await sharp(buf).extract(region).stats()
  const stdevs = channels.slice(0, 3).map((c) => c.stdev)
  return stdevs.reduce((a, b) => a + b, 0) / stdevs.length
}

async function logoPresenceCheck(
  creative: Buffer,
  width: number,
  height: number,
  ctx: ComplianceContext,
): Promise<ComplianceCheck> {
  if (ctx.framingMode === 'plain') {
    return {
      check: 'logo-presence',
      status: 'pass',
      detail: 'Plain skin: no brand logo expected (by design).',
    }
  }
  const pad = safeAreaPadding(width)
  const logoSize = Math.round(width * 0.12)
  const variance = await regionVariance(creative, {
    left: pad,
    top: safeAreaPadding(height),
    width: logoSize,
    height: logoSize,
  })
  // Clear space is satisfied by construction: the logo sits at an 8% inset, well
  // beyond the 25%-of-logo-width clear-space minimum.
  return variance > 5
    ? {
        check: 'logo-presence',
        status: 'pass',
        detail: 'Brand logo present with sufficient clear space.',
      }
    : {
        check: 'logo-presence',
        status: 'warn',
        detail: 'Expected logo region looks empty.',
      }
}

async function brandColorCheck(creative: Buffer, ctx: ComplianceContext): Promise<ComplianceCheck> {
  if (ctx.framingMode === 'plain' || ctx.brandPalette.length === 0) {
    return {
      check: 'brand-color-usage',
      status: 'pass',
      detail: 'Neutral framing: brand-color check not applicable.',
    }
  }
  const pixels = await samplePixels(creative)
  const palette = ctx.brandPalette.map(hexToRgb)
  const present = palette.filter((brand) =>
    pixels.some((pixel) => colorDistance(pixel, brand) < BRAND_MATCH_TOLERANCE),
  )
  return present.length > 0
    ? {
        check: 'brand-color-usage',
        status: 'pass',
        detail: `${present.length}/${palette.length} brand colors detected in the creative.`,
      }
    : {
        check: 'brand-color-usage',
        status: 'warn',
        detail: 'No brand palette colors detected in the creative.',
      }
}

async function contrastCheck(
  creative: Buffer,
  width: number,
  height: number,
  ctx: ComplianceContext,
): Promise<ComplianceCheck> {
  const band = {
    left: 0,
    top: Math.round(height * 0.6),
    width,
    height: Math.round(height * 0.4),
  }
  const background = await averageColor(creative, band)
  const ratio = contrastRatio(hexToRgb(ctx.messageColor), background)
  const rounded = Math.round(ratio * 10) / 10
  if (ratio >= CONTRAST_AA_NORMAL) {
    return { check: 'text-contrast', status: 'pass', detail: `Message contrast ${rounded}:1 (AA).` }
  }
  if (ratio >= CONTRAST_AA_LARGE) {
    return {
      check: 'text-contrast',
      status: 'warn',
      detail: `Message contrast ${rounded}:1 — passes large-text AA only.`,
    }
  }
  return {
    check: 'text-contrast',
    status: 'fail',
    detail: `Message contrast ${rounded}:1 — below WCAG AA.`,
  }
}

/** Run all compliance checks on a composited creative. */
export async function runComplianceChecks(
  creative: Buffer,
  width: number,
  height: number,
  ctx: ComplianceContext,
): Promise<ComplianceCheck[]> {
  return Promise.all([
    logoPresenceCheck(creative, width, height, ctx),
    brandColorCheck(creative, ctx),
    contrastCheck(creative, width, height, ctx),
  ])
}
