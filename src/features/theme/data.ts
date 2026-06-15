import 'server-only'

// Read layer for themes: a member's saved custom themes + the admin-set global
// default. Both are validated through the theme schema so untrusted token values can
// never reach the <style> injection in apply.ts. Runs as the signed-in user (RLS).
import { createSupabaseServerClient } from '@/services/supabase/server'
import { parseStoredTheme } from '@/components/theme/schema'
import { GLOBAL_THEME_ID, GLOBAL_THEME_KEY, type CustomTheme } from '@/components/theme/constants'

export async function listMyThemes(): Promise<CustomTheme[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('themes')
    .select('id, name, tokens')
    .order('created_at', { ascending: true })
  return (data ?? [])
    .map((row) => parseStoredTheme(row.id, row.name, row.tokens))
    .filter((theme): theme is CustomTheme => theme !== null)
}

export async function getGlobalTheme(): Promise<CustomTheme | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', GLOBAL_THEME_KEY)
    .maybeSingle()
  if (!data?.value) return null
  const value = data.value
  const name = typeof value.name === 'string' ? value.name : 'Global theme'
  return parseStoredTheme(GLOBAL_THEME_ID, name, value)
}
