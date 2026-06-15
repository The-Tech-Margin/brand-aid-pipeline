// Maps the structured intake form's state to a raw brief object and validates it
// with the shared zod schema — so the form and the paste/upload path enforce the
// exact same rules. Pure, no React, unit-testable.
import { validateBrief, type BriefParseResult } from './parse'
import type { AspectRatio, Brief } from './schema'
import type { ImageModelId } from '@/services/image/types'

export interface ProductFormInput {
  name: string
  description: string
  /** Comma/newline-separated filenames to reuse; empty means generate. */
  input_assets: string
  /** Optional art direction for the AI hero (used only on the generate path). */
  creative_direction: string
}

export interface BriefFormState {
  campaign_name: string
  products: ProductFormInput[]
  target_region: string
  target_audience: string
  campaign_message: string
  locale: string
  /** Comma/newline-separated hex colors. */
  brand_palette: string
  image_model: ImageModelId
  aspect_ratios: AspectRatio[]
}

function splitList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function emptyProduct(): ProductFormInput {
  return { name: '', description: '', input_assets: '', creative_direction: '' }
}

export function emptyBriefForm(): BriefFormState {
  return {
    campaign_name: '',
    products: [emptyProduct()],
    target_region: '',
    target_audience: '',
    campaign_message: '',
    locale: '',
    brand_palette: '',
    image_model: 'openai',
    aspect_ratios: ['1:1', '9:16', '16:9'],
  }
}

export function briefFromForm(state: BriefFormState): BriefParseResult {
  const raw: Record<string, unknown> = {
    campaign_name: state.campaign_name,
    products: state.products.map((p) => {
      const product: Record<string, unknown> = {
        name: p.name,
        description: p.description,
        input_assets: splitList(p.input_assets),
      }
      if (p.creative_direction.trim()) product.creative_direction = p.creative_direction.trim()
      return product
    }),
    target_region: state.target_region,
    target_audience: state.target_audience,
    campaign_message: state.campaign_message,
    image_model: state.image_model,
    aspect_ratios: state.aspect_ratios,
  }
  if (state.locale.trim()) raw.locale = state.locale.trim()
  const palette = splitList(state.brand_palette)
  if (palette.length) raw.brand_palette = palette
  return validateBrief(raw)
}

// Inverse of briefFromForm — hydrate the form state from an existing brief (used to
// prefill /campaigns/new from a help-guide example). Arrays become the comma-
// separated strings the form fields expect.
export function briefToFormState(brief: Brief): BriefFormState {
  return {
    campaign_name: brief.campaign_name,
    products: brief.products.map((p) => ({
      name: p.name,
      description: p.description,
      input_assets: p.input_assets.join(', '),
      creative_direction: p.creative_direction ?? '',
    })),
    target_region: brief.target_region,
    target_audience: brief.target_audience,
    campaign_message: brief.campaign_message,
    locale: brief.locale ?? '',
    brand_palette: brief.brand_palette?.join(', ') ?? '',
    image_model: brief.image_model ?? 'openai',
    aspect_ratios: brief.aspect_ratios,
  }
}
