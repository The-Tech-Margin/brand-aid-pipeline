'use server'

// Theme write actions. Personal themes run as the signed-in member (the themes_owner
// RLS policy confines every write to their own rows); the global default is guarded by
// both an explicit admin role check here and the app_settings admin RLS policy. Every
// token value is re-validated before any DB write — see schema.ts for why that matters.
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { getMyMembership } from '@/features/members/data'
import {
  saveThemeInputSchema,
  globalThemeInputSchema,
  parseStoredTheme,
} from '@/components/theme/schema'
import { GLOBAL_THEME_ID, GLOBAL_THEME_KEY, type CustomTheme } from '@/components/theme/constants'

export type ThemeActionResult = { ok: true; theme?: CustomTheme } | { ok: false; error: string }

export async function saveThemeAction(input: unknown): Promise<ThemeActionResult> {
  const membership = await getMyMembership()
  if (membership?.status !== 'active') return { ok: false, error: 'Not authorized' }

  const parsed = saveThemeInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid theme' }
  }
  const { id, name, light, dark } = parsed.data
  const supabase = await createSupabaseServerClient()
  const tokens = { light, dark }

  if (id) {
    const { data, error } = await supabase
      .from('themes')
      .update({ name, tokens })
      .eq('id', id)
      .select('id, name, tokens')
      .single()
    if (error || !data) return { ok: false, error: 'Could not update theme' }
    revalidatePath('/theme')
    return { ok: true, theme: parseStoredTheme(data.id, data.name, data.tokens) ?? undefined }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authorized' }
  const { data, error } = await supabase
    .from('themes')
    .insert({ user_id: user.id, name, tokens })
    .select('id, name, tokens')
    .single()
  if (error || !data) return { ok: false, error: 'Could not save theme' }
  revalidatePath('/theme')
  return { ok: true, theme: parseStoredTheme(data.id, data.name, data.tokens) ?? undefined }
}

export async function deleteThemeAction(id: string): Promise<ThemeActionResult> {
  const membership = await getMyMembership()
  if (membership?.status !== 'active') return { ok: false, error: 'Not authorized' }
  if (!id) return { ok: false, error: 'Missing theme id' }
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('themes').delete().eq('id', id)
  if (error) return { ok: false, error: 'Could not delete theme' }
  revalidatePath('/theme')
  return { ok: true }
}

export async function setGlobalThemeAction(input: unknown): Promise<ThemeActionResult> {
  const membership = await getMyMembership()
  if (membership?.role !== 'admin' || membership.status !== 'active') {
    return { ok: false, error: 'Admins only' }
  }
  const parsed = globalThemeInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid theme' }
  }
  const { name, light, dark } = parsed.data
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: GLOBAL_THEME_KEY, value: { name, light, dark }, updated_by: user?.id ?? null })
  if (error) return { ok: false, error: 'Could not set the global theme' }
  revalidatePath('/', 'layout')
  return {
    ok: true,
    theme: parseStoredTheme(GLOBAL_THEME_ID, name, { name, light, dark }) ?? undefined,
  }
}

export async function clearGlobalThemeAction(): Promise<ThemeActionResult> {
  const membership = await getMyMembership()
  if (membership?.role !== 'admin' || membership.status !== 'active') {
    return { ok: false, error: 'Admins only' }
  }
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('app_settings').delete().eq('key', GLOBAL_THEME_KEY)
  if (error) return { ok: false, error: 'Could not clear the global theme' }
  revalidatePath('/', 'layout')
  return { ok: true }
}
