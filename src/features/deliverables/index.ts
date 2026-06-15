// Public deliverables API — branded PDFs + social assets generated on demand from a
// campaign's creatives and brand kit. Builders are pure; collectors are server-only.
export { toBrandKit } from './brand-kit'
export {
  collectCampaignDeliverables,
  collectCreative,
  type CampaignBrandFields,
  type CampaignDeliverables,
  type CreativeDeliverable,
} from './collect'
export { buildCampaignPdf } from './pdf/campaign-pdf'
export { buildBrandSheetPdf } from './pdf/brand-sheet-pdf'
export { buildSpecSheetPdf } from './pdf/spec-sheet-pdf'
export { buildSocialPost } from './social/social-post'
export {
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_IDS,
  isSocialPlatform,
  type SocialPlatform,
} from './social/platforms'
export type { DeliverableBrandKit, EmbeddableCreative, DeliverableProduct } from './types'
