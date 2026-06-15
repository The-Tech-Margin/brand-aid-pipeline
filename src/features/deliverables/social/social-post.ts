// Deliverable #4 — an upload-ready, platform-sized social asset from an existing
// creative. Sharp cover-crops the (already branded) creative to the platform canvas
// and re-stamps the brand color bar, reusing the compositor's colorBarSvg so social
// posts match the on-platform look. Pure (no storage/route deps).
import sharp from 'sharp'
import { colorBarSvg } from '@/features/pipeline/compositor/overlay'
import { SOCIAL_PLATFORMS, type SocialPlatform } from './platforms'
import type { DeliverableBrandKit } from '../types'

export interface SocialPostArgs {
  brand: DeliverableBrandKit
  creativePng: Uint8Array
  platform: SocialPlatform
}

export interface SocialPostResult {
  bytes: Buffer
  width: number
  height: number
  platform: SocialPlatform
}

export async function buildSocialPost(args: SocialPostArgs): Promise<SocialPostResult> {
  const spec = SOCIAL_PLATFORMS[args.platform]
  const base = await sharp(Buffer.from(args.creativePng))
    .resize(spec.width, spec.height, { fit: 'cover', position: 'attention' })
    .png()
    .toBuffer()

  let bytes = base
  if (args.brand.palette.length > 0) {
    const barHeight = Math.max(6, Math.round(spec.height * 0.014))
    bytes = await sharp(base)
      .composite([
        {
          input: Buffer.from(colorBarSvg(spec.width, barHeight, args.brand.palette)),
          left: 0,
          top: spec.height - barHeight,
        },
      ])
      .png()
      .toBuffer()
  }

  return { bytes, width: spec.width, height: spec.height, platform: args.platform }
}
