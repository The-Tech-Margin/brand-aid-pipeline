// Target platform canvases for the "individual social post" deliverable. Pure data
// + guards so routes can validate a [platform] path segment.
export type SocialPlatform = 'instagram-square' | 'instagram-story' | 'facebook-feed' | 'linkedin'

export interface PlatformSpec {
  id: SocialPlatform
  label: string
  width: number
  height: number
}

export const SOCIAL_PLATFORMS: Record<SocialPlatform, PlatformSpec> = {
  'instagram-square': {
    id: 'instagram-square',
    label: 'Instagram square',
    width: 1080,
    height: 1080,
  },
  'instagram-story': { id: 'instagram-story', label: 'Instagram story', width: 1080, height: 1920 },
  'facebook-feed': { id: 'facebook-feed', label: 'Facebook feed', width: 1200, height: 630 },
  linkedin: { id: 'linkedin', label: 'LinkedIn', width: 1200, height: 627 },
}

export const SOCIAL_PLATFORM_IDS = Object.keys(SOCIAL_PLATFORMS) as SocialPlatform[]

export function isSocialPlatform(value: string): value is SocialPlatform {
  return value in SOCIAL_PLATFORMS
}
