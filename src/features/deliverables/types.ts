// Shared types for branded document/asset generation. Builders take already-loaded
// bytes (logo, creative PNGs) as inputs so they stay pure and unit-testable without
// the route/storage layer; the routes do the server-only loading.
import type { AspectRatio } from '@/features/brief/schema'
import type { ComplianceCheck } from '@/features/pipeline/compliance/types'

/** Normalized brand inputs the PDF/asset builders draw from. Never hardcode hexes;
 *  everything here is derived from campaigns.brand_palette + compositor framing. */
export interface DeliverableBrandKit {
  campaignName: string
  /** Campaign voice line (campaigns.message). */
  message: string
  /** Brand palette hex colors (campaigns.brand_palette ?? []). */
  palette: string[]
  /** Primary accent — palette[0] or a neutral fallback. */
  primary: string
  /** Overlay/heading text color (framing.textColor ?? '#111111'). */
  textColor: string
  region: string
  audience: string
  locale: string | null
}

/** A creative ready to embed: its metadata + the decoded PNG bytes (+ compliance). */
export interface EmbeddableCreative {
  productName: string
  productSlug: string
  ratio: AspectRatio
  width: number | null
  height: number | null
  source: string
  png: Uint8Array
  /** Empty for the campaign PDF; populated for spec sheets. */
  compliance: ComplianceCheck[]
}

/** A product grouping for the multi-page campaign PDF. */
export interface DeliverableProduct {
  productName: string
  productSlug: string
  creatives: EmbeddableCreative[]
}
