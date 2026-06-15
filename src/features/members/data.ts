import 'server-only'

// Read layer for membership. `getMyMembership` powers the (app) access gate;
// `listMembers` powers the admin invite panel (RLS lets admins read all rows).
import { createSupabaseServerClient } from '@/services/supabase/server'
import type { MemberRow } from '@/types/database'

export async function getMyMembership(): Promise<MemberRow | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('members').select('*').eq('user_id', user.id).maybeSingle()
  return data ?? null
}

export async function listMembers(): Promise<MemberRow[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

/** Map owner user_ids → a display label (full name, falling back to email). RLS scopes
 *  the member read: admins resolve every owner, visitors only themselves — so record
 *  views show all owners for admins and just the signed-in user otherwise. */
export async function getOwnerLabels(userIds: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(userIds.filter(Boolean))]
  const labels = new Map<string, string>()
  if (ids.length === 0) return labels
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('members')
    .select('user_id, full_name, email')
    .in('user_id', ids)
  for (const m of data ?? []) {
    if (m.user_id) labels.set(m.user_id, m.full_name?.trim() || m.email)
  }
  return labels
}
