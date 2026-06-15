// Campaign brief schema — the single source of truth for brief shape. Types are
// inferred from zod so the form, the API, and the pipeline never drift apart.
import { z } from 'zod'
import { IMAGE_MODELS } from '@/services/image/types'

/** Image-generation provider for the hero step (validated from the service list). */
export const imageModelSchema = z.enum(IMAGE_MODELS)

/** Supported output aspect ratios and their pixel dimensions. */
export const ASPECT_RATIOS = ['1:1', '9:16', '16:9'] as const
export const aspectRatioSchema = z.enum(ASPECT_RATIOS)
export type AspectRatio = (typeof ASPECT_RATIOS)[number]

export const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '1:1': { width: 1080, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '16:9': { width: 1920, height: 1080 },
}

/** URL/cross-platform-safe folder segment for a ratio ("1:1" -> "1x1"). */
export function ratioPathSegment(ratio: AspectRatio): string {
  return ratio.replace(':', 'x')
}

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a hex color like #E904E5')

// Input assets are plain filenames that get joined into private storage paths and
// fetched with the RLS-bypassing admin client. Constrain them to a safe filename
// (no path separators or traversal) so a brief can't reach outside the asset library.
const assetFilename = z
  .string()
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
    'Asset names must be a plain filename (letters, numbers, . _ -)',
  )

/** A text field that's optional in the form: blank input falls back to `fallback`, so
 *  only the truly essential fields block submission. */
function defaulted(fallback: string) {
  return z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().min(1).default(fallback),
  )
}

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  description: z.string().trim().default(''),
  input_assets: z.array(assetFilename).default([]),
  /** Optional art direction for the AI hero generation (ignored when an input asset
   *  is reused). Free text, length-capped. */
  creative_direction: z.string().trim().max(300).optional(),
})
export type ProductInput = z.infer<typeof productSchema>

export const briefSchema = z.object({
  // Only a product name is truly required; the rest default so a campaign can be created
  // with minimal input (and quick-suggestion chips make filling the rest one click).
  campaign_name: defaulted('Untitled campaign'),
  products: z.array(productSchema).min(1, 'Add at least one product'),
  target_region: defaulted('Global'),
  target_audience: defaulted('General audience'),
  campaign_message: z.string().trim().default(''),
  locale: z.string().optional(),
  brand_palette: z.array(hexColor).optional(),
  image_model: imageModelSchema.default('openai'),
  aspect_ratios: z
    .array(aspectRatioSchema)
    .min(1)
    .default([...ASPECT_RATIOS]),
})

/** A validated campaign brief. */
export type Brief = z.infer<typeof briefSchema>
