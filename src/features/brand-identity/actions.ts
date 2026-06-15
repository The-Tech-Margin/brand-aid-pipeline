'use server'

// Brand identity write actions. A member edits their own brand (brand_profiles, owner
// RLS); an admin can publish their own brand as the app-wide global default
// (app_settings, admin RLS + an explicit role check). Logos are uploaded separately via
// POST /api/assets?scope=logo; here we just persist the resulting storage path.
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { getMyMembership } from '@/features/members/data'
import { brandInputSchema } from './schema'
import { GLOBAL_BRAND_KEY } from './constants'
import { sanitizeFontFamily } from './fonts'

export type BrandActionResult = { ok: true } | { ok: false; error: string }

function logoPathFor(userId: string, filename: string): string {
  return `brand-logos/${userId}/${filename}`
}

export async function saveBrandAction(input: unknown): Promise<BrandActionResult> {
  const membership = await getMyMembership()
  if (membership?.status !== 'active') return { ok: false, error: 'Not authorized' }

  const parsed = brandInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid brand' }
  }
  const { businessName, logoFilename, removeLogo, displayFont } = parsed.data

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authorized' }

  // business_name is always written; logo_path only when adding or removing one (omit to
  // preserve the existing logo on upsert).
  const row: {
    user_id: string
    business_name: string | null
    logo_path?: string | null
    updated_at: string
  } = {
    user_id: user.id,
    business_name: businessName?.trim() || null,
    updated_at: new Date().toISOString(),
  }
  if (logoFilename) row.logo_path = logoPathFor(user.id, logoFilename)
  else if (removeLogo) row.logo_path = null

  const { error } = await supabase.from('brand_profiles').upsert(row)
  if (error) return { ok: false, error: 'Could not save your brand' }

  // The decorative font lives in a column added by migration 0009. Write it best-effort
  // so name/logo still save on a DB where that migration hasn't been applied yet.
  await supabase
    .from('brand_profiles')
    .update({ display_font: sanitizeFontFamily(displayFont) })
    .eq('user_id', user.id)

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function publishGlobalBrandAction(): Promise<BrandActionResult> {
  const membership = await getMyMembership()
  if (membership?.role !== 'admin' || membership.status !== 'active') {
    return { ok: false, error: 'Admins only' }
  }
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authorized' }

  // Publish the admin's own brand as the global default. The font is read best-effort so
  // publishing still works before migration 0009 is applied.
  const [{ data: mine }, { data: fontRow }] = await Promise.all([
    supabase
      .from('brand_profiles')
      .select('business_name, logo_path')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('brand_profiles').select('display_font').eq('user_id', user.id).maybeSingle(),
  ])

  const value = {
    businessName: mine?.business_name ?? null,
    logoPath: mine?.logo_path ?? null,
    displayFont: fontRow?.display_font ?? null,
  }
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: GLOBAL_BRAND_KEY, value, updated_by: user.id })
  if (error) return { ok: false, error: 'Could not set the global brand' }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function clearGlobalBrandAction(): Promise<BrandActionResult> {
  const membership = await getMyMembership()
  if (membership?.role !== 'admin' || membership.status !== 'active') {
    return { ok: false, error: 'Admins only' }
  }
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('app_settings').delete().eq('key', GLOBAL_BRAND_KEY)
  if (error) return { ok: false, error: 'Could not clear the global brand' }

  revalidatePath('/', 'layout')
  return { ok: true }
}
