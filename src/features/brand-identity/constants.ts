// Brand identity (business name + logo). Resolution mirrors themes: a member's own
// brand overrides the admin-set global, which overrides this built-in default.
export const GLOBAL_BRAND_KEY = 'global_brand'

/** The effective brand for rendering (logo already resolved to a URL). */
export interface Brand {
  businessName: string
  logoUrl: string | null
  /** Sanitized Google Fonts family for the decorative wordmark; null = built-in default. */
  displayFont: string | null
}

/** Stored shape (a storage path, not a URL). */
export interface BrandSettings {
  businessName: string | null
  logoPath: string | null
  displayFont: string | null
}

export const DEFAULT_BRAND: Brand = {
  businessName: 'Brand Helper',
  logoUrl: '/images/logo.png',
  displayFont: null,
}
