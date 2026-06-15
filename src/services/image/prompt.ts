// Hero-image prompt builder — pure, so it unit-tests without any network. Composes
// product + audience + region + message + brand mood, and a negative prompt that
// keeps text/logos out of the generation (we overlay those ourselves). The gateway
// client folds the negative guidance into the prompt for providers without a
// structured negative-prompt field.
import type { Brief, ProductInput } from '@/features/brief/schema'

export interface HeroPrompt {
  prompt: string
  negativePrompt: string
}

const BRAND_MOOD =
  'vibrant, tech-forward, premium consumer-goods aesthetic, studio product photography, clean composition, soft lighting, high detail'

const NEGATIVE_PROMPT =
  'text, words, letters, typography, captions, watermark, logo, brand marks, signature, low resolution, blurry, distorted, deformed, extra limbs'

/** Preset edit instruction for the editor's "remove background" quick action. */
export const REMOVE_BG_PROMPT =
  'Remove the background completely, leaving only the main subject on a fully transparent background. Output a clean cutout with alpha transparency.'

export function buildHeroPrompt(brief: Brief, product: ProductInput): HeroPrompt {
  const direction = product.creative_direction?.trim()
  const prompt = [
    `Hero product image of ${product.name}${product.description ? `: ${product.description}` : ''}.`,
    `Target market: ${brief.target_region}. Audience: ${brief.target_audience}.`,
    `Evoke the campaign message "${brief.campaign_message}".`,
    direction ? `Art direction: ${direction}.` : null,
    BRAND_MOOD,
    'Leave clear negative space for a text overlay.',
  ]
    .filter(Boolean)
    .join(' ')

  return { prompt, negativePrompt: NEGATIVE_PROMPT }
}
