import 'server-only'

// Admin read of access requests. RLS (access_requests_admin_read + is_admin) restricts
// this to admins; the /admin route additionally guards the role. Uses the RLS-bound
// server client, like listMembers.
import { createSupabaseServerClient } from '@/services/supabase/server'
import type { AccessRequestRow, AccessRequestStatus } from '@/types/database'

export async function listAccessRequests(
  status?: AccessRequestStatus,
): Promise<AccessRequestRow[]> {
  const supabase = await createSupabaseServerClient()
  let query = supabase.from('access_requests').select('*').order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data } = await query
  return data ?? []
}
