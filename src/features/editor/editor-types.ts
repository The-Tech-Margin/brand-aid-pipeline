// Shared editor types. BrandKit comes from the creatives read layer (palette +
// logo); the editor threads it into the canvas so edits stay on-brand.
import type { AspectRatio } from '@/features/brief/schema'
import type { CampaignBrandKit } from '@/features/creatives/creatives'

export type { CampaignBrandKit }

export interface EditorTarget {
  /** Existing creative to edit (save-back to /creatives/[assetId]/edit), or null for a new design. */
  assetId: string | null
  campaignId: string
  /** Product to attribute a new design to (optional). */
  productId?: string | null
  ratio: AspectRatio
  /** Source image URL for an existing creative; null for a blank canvas. */
  imageUrl: string | null
  name: string
}

export type AiEditOp = 'remove-bg' | 'generative'
