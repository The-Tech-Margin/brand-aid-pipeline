import 'server-only'

// Marks a member active on first sign-in. Admin assignment lives in the DB: the
// brand_helper.admin_allowlist table is the source of truth and a trigger stamps
// members.role from it on every write (migration 0006). So this never sets a role —
// it reads the allowlist only to decide whether an uninvited sign-in may bootstrap.
// Access is invite-only: invited visitors arrive with a pre-created row that this
// flips invited -> active; an allowlisted admin with no row is bootstrapped; any
// other uninvited sign-in is DENIED (no row created). The decision is pure logic in
// activation-decision.ts; this just applies it.
import { createSupabaseAdminClient } from '@/services/supabase/admin'
import { decideActivation } from './activation-decision'

export async function activateMember(
  userId: string,
  email: string,
): Promise<{ activated: boolean }> {
  const admin = createSupabaseAdminClient()
  const normalized = email.toLowerCase()
  const now = new Date().toISOString()

  const [{ data: existing }, { data: adminRow }] = await Promise.all([
    admin.from('members').select('id').eq('user_id', userId).maybeSingle(),
    admin.from('admin_allowlist').select('email').eq('email', normalized).maybeSingle(),
  ])

  const decision = decideActivation({
    hasExistingRow: existing != null,
    isAdminEmail: adminRow != null,
  })

  switch (decision.kind) {
    case 'activate-existing':
      // Role is re-stamped from the allowlist by the members trigger.
      await admin
        .from('members')
        .update({ status: 'active', activated_at: now })
        .eq('user_id', userId)
      return { activated: true }
    case 'bootstrap-admin':
      // No role passed — the trigger stamps it 'admin' from the allowlist.
      await admin
        .from('members')
        .upsert(
          { email: normalized, user_id: userId, status: 'active', activated_at: now },
          { onConflict: 'email' },
        )
      return { activated: true }
    case 'deny':
      return { activated: false }
  }
}
