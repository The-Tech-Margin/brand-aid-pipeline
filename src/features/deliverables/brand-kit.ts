// Pure brand-kit normalizer — maps a campaign row + compositor framing into the
// inputs every deliverable draws from. No hardcoded colors: swatches and accents
// come from campaigns.brand_palette, matching the compositor's brand system.
import type { CampaignRow } from '@/types/database'
import type { DeliverableBrandKit } from './types'

const FALLBACK_PRIMARY = '#111111'
const FALLBACK_TEXT = '#111111'

export function toBrandKit(
  campaign: Pick<
    CampaignRow,
    'name' | 'message' | 'region' | 'audience' | 'locale' | 'brand_palette'
  >,
  framing: { textColor?: string } = {},
): DeliverableBrandKit {
  const palette = campaign.brand_palette ?? []
  return {
    campaignName: campaign.name,
    message: campaign.message,
    palette,
    primary: palette[0] ?? FALLBACK_PRIMARY,
    textColor: framing.textColor ?? FALLBACK_TEXT,
    region: campaign.region,
    audience: campaign.audience,
    locale: campaign.locale,
  }
}
