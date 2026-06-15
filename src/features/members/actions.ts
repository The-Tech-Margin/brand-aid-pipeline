'use server'

// Invite a visitor by email. Admin-only: the caller must be an active admin
// member. Uses the service role to create the auth user (inviteUserByEmail) and
// record the membership row; the visitor then signs in via magic link.
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { canInvite } from './invite-authorization'
import { inviteMember } from './invite-member'

export interface InviteState {
  error?: string
  invited?: string
}

export async function inviteVisitor(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  if (!email) return { error: 'Enter an email address.' }

  // The caller must be an active admin.
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }
  const { data: me } = await supabase
    .from('members')
    .select('role,status')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!canInvite(me)) {
    return { error: 'Only admins can send invites.' }
  }

  const result = await inviteMember({ email, invitedBy: user.id })
  if (!result.ok) return { error: result.error }

  revalidatePath('/dashboard')
  return { invited: email }
}
