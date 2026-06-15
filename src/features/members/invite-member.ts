import 'server-only'

// The single place that creates (or re-uses) the auth user and upserts the members row.
// Shared by the manual invite (inviteVisitor) and access-request approval. Role is never
// set here — the 0006 trigger stamps members.role from the admin allowlist.
import { createSupabaseAdminClient } from '@/services/supabase/admin'
import { getURL } from '@/lib/get-url'

export interface InviteMemberInput {
  /** Already trimmed + lowercased by the caller. */
  email: string
  /** The inviting admin's auth user id. */
  invitedBy: string
  fullName?: string | null
  organization?: string | null
}

export type InviteMemberResult = { ok: true; userId: string } | { ok: false; error: string }

export async function inviteMember(input: InviteMemberInput): Promise<InviteMemberResult> {
  const admin = createSupabaseAdminClient()

  const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: `${getURL()}auth/callback?redirect=/dashboard`,
  })
  if (error || !invited?.user) {
    return { ok: false, error: error?.message ?? 'Invite failed.' }
  }

  const { error: upsertError } = await admin.from('members').upsert(
    {
      email: input.email,
      user_id: invited.user.id,
      status: 'invited',
      invited_by: input.invitedBy,
      full_name: input.fullName ?? null,
      organization: input.organization ?? null,
    },
    { onConflict: 'email' },
  )
  if (upsertError) return { ok: false, error: upsertError.message }

  return { ok: true, userId: invited.user.id }
}
