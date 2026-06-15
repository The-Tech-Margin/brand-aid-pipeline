import 'server-only'

// Read layer for brand identity. resolveBrand() computes the effective brand for the
// app chrome (member > admin global > default), signing the logo for rendering. The
// studio helpers return the member's own brand and the current global for the editor.
import { createSupabaseServerClient } from '@/services/supabase/server'
import { createSupabaseAdminClient } from '@/services/supabase/admin'
import { env } from '@/config/env'
import { DEFAULT_BRAND, GLOBAL_BRAND_KEY, type Brand, type BrandSettings } from './constants'
import { sanitizeFontFamily } from './fonts'

// Only sign paths in the brand-logos/{userId}/{filename} namespace. The global brand's
// logo path comes from admin-writable app_settings, so never sign an arbitrary storage
// key (defense in depth on top of the filename validation at write time).
const SAFE_LOGO_PATH = /^brand-logos\/[0-9a-f-]{8,}\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/

async function signLogo(logoPath: string | null): Promise<string | null> {
  if (!logoPath || !SAFE_LOGO_PATH.test(logoPath)) return null
  const admin = createSupabaseAdminClient()
  const { data } = await admin.storage.from(env.storageBucket()).createSignedUrl(logoPath, 3600)
  return data?.signedUrl ?? null
}

/** Best-effort read of the member's decorative font. Tolerates the 0009 column being
 *  absent on an un-migrated DB by treating any error as "no font", so the core brand
 *  read never breaks. */
async function readMyDisplayFont(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('brand_profiles')
    .select('display_font')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return null
  return data?.display_font ?? null
}

async function readGlobal(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<BrandSettings> {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', GLOBAL_BRAND_KEY)
    .maybeSingle()
  const value = (data?.value ?? {}) as {
    businessName?: unknown
    logoPath?: unknown
    displayFont?: unknown
  }
  return {
    businessName: typeof value.businessName === 'string' ? value.businessName : null,
    logoPath: typeof value.logoPath === 'string' ? value.logoPath : null,
    displayFont: typeof value.displayFont === 'string' ? value.displayFont : null,
  }
}

/** Effective brand for the header/footer: member overrides global overrides default.
 *  Runs in the root layout on every request, so any failure (e.g. the 0008 table not yet
 *  applied) falls back to the built-in default rather than breaking the page. */
export async function resolveBrand(): Promise<Brand> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return DEFAULT_BRAND

    const [{ data: mine }, global, myFont] = await Promise.all([
      supabase
        .from('brand_profiles')
        .select('business_name, logo_path')
        .eq('user_id', user.id)
        .maybeSingle(),
      readGlobal(supabase),
      readMyDisplayFont(supabase, user.id),
    ])

    const businessName =
      mine?.business_name?.trim() || global.businessName?.trim() || DEFAULT_BRAND.businessName
    const logoPath = mine?.logo_path ?? global.logoPath ?? null
    const logoUrl = logoPath
      ? ((await signLogo(logoPath)) ?? DEFAULT_BRAND.logoUrl)
      : DEFAULT_BRAND.logoUrl
    const displayFont = sanitizeFontFamily(myFont ?? global.displayFont)

    return { businessName, logoUrl, displayFont }
  } catch (err) {
    if (isFrameworkError(err)) throw err
    console.error('[brand] resolveBrand failed:', err)
    return DEFAULT_BRAND
  }
}

/** Next.js control-flow signals (dynamic rendering, redirect, notFound) carry a digest
 *  and must propagate, not be swallowed as data errors. */
function isFrameworkError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'digest' in err
}

export interface BrandStudioData {
  /** The member's own brand (empty strings/null when unset), for prefilling the editor. */
  businessName: string
  logoUrl: string | null
  displayFont: string
  /** The admin-set global default, if any. */
  global: Brand | null
}

const EMPTY_STUDIO: BrandStudioData = {
  businessName: '',
  logoUrl: null,
  displayFont: '',
  global: null,
}

export async function getBrandStudioData(): Promise<BrandStudioData> {
  try {
    return await loadBrandStudioData()
  } catch (err) {
    if (isFrameworkError(err)) throw err
    console.error('[brand] getBrandStudioData failed:', err)
    return EMPTY_STUDIO
  }
}

async function loadBrandStudioData(): Promise<BrandStudioData> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return EMPTY_STUDIO

  const [{ data: mine }, global, myFont] = await Promise.all([
    supabase
      .from('brand_profiles')
      .select('business_name, logo_path')
      .eq('user_id', user.id)
      .maybeSingle(),
    readGlobal(supabase),
    readMyDisplayFont(supabase, user.id),
  ])

  const globalBrand: Brand | null =
    global.businessName || global.logoPath || global.displayFont
      ? {
          businessName: global.businessName ?? DEFAULT_BRAND.businessName,
          logoUrl: (await signLogo(global.logoPath)) ?? DEFAULT_BRAND.logoUrl,
          displayFont: sanitizeFontFamily(global.displayFont),
        }
      : null

  return {
    businessName: mine?.business_name ?? '',
    logoUrl: await signLogo(mine?.logo_path ?? null),
    displayFont: myFont ?? '',
    global: globalBrand,
  }
}
