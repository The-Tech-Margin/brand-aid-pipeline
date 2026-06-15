'use server'

// Visitor access requests. The PUBLIC submit runs unauthenticated: it rate-limits by IP,
// validates, and inserts with the SERVICE ROLE (anon has no grants in this schema — 0005),
// mirroring login_attempts. The ADMIN actions re-derive the caller server-side and act with
// the service role. Every response is uniform so the public endpoint never reveals whether
// an email already has access.
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { createSupabaseAdminClient } from '@/services/supabase/admin'
import { checkRateLimit } from '@/features/auth/rate-limit'
import { clientIp } from '@/features/auth/client-ip'
import { inviteMember } from '@/features/members/invite-member'
import {
  sendAccessRequestConfirmation,
  sendAccessRequestNotification,
} from '@/services/email/resend'
import { accessRequestSchema } from './schema'
import { canReviewRequests } from './request-authorization'

export interface AccessRequestState {
  error?: string
  ok?: boolean
}

const OK: AccessRequestState = { ok: true }
const REQUEST_LIMIT = { maxAttempts: 5, windowMs: 60 * 60 * 1000 }

/** Public: submit an access request. Always returns a uniform success (no enumeration). */
export async function submitAccessRequest(
  _prev: AccessRequestState,
  formData: FormData,
): Promise<AccessRequestState> {
  // 1. Rate-limit first (unauthenticated public endpoint — tighter than login).
  const { allowed } = await checkRateLimit('request', await clientIp(), REQUEST_LIMIT)
  if (!allowed) return { error: 'Too many requests. Please try again later.' }

  // 2. Validate + normalize.
  const parsed = accessRequestSchema.safeParse({
    name: formData.get('name'),
    organization: formData.get('organization'),
    email: formData.get('email'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check your entries.' }
  }
  const { name, organization, email } = parsed.data

  // 3. Insert with the service role. The partial unique index dedupes pending-by-email at
  //    the DB layer (no read-then-write race); a unique violation means a pending request
  //    already exists — treat as success (idempotent, no info leak).
  const admin = createSupabaseAdminClient()
  const { error } = await admin.from('access_requests').insert({ name, organization, email })
  if (error) {
    if (error.code === '23505') return OK
    console.error('[access-request] insert failed:', error.message)
    return { error: 'Something went wrong. Please try again.' }
  }

  // 4. Best-effort emails (no-op without Resend; never block the submit).
  await Promise.all([
    sendAccessRequestNotification({ name, organization, email }),
    sendAccessRequestConfirmation({ name, email }),
  ])

  return OK
}

/** Re-derive the caller and require an active admin. */
async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'You must be signed in.' }
  const { data: me } = await supabase
    .from('members')
    .select('role,status')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!canReviewRequests(me)) return { ok: false, error: 'Admins only.' }
  return { ok: true, userId: user.id }
}

/** Approve a pending request: grant access (invite or re-activate) + mark approved. */
export async function approveAccessRequest(id: string): Promise<AccessRequestState> {
  const gate = await requireAdmin()
  if (!gate.ok) return { error: gate.error }
  const admin = createSupabaseAdminClient()

  const { data: req } = await admin.from('access_requests').select('*').eq('id', id).maybeSingle()
  if (!req || req.status !== 'pending') {
    return { error: 'Request not found or already handled.' }
  }

  // If the email is already a member, re-activate + refresh name/org (inviteUserByEmail
  // would error on an existing auth user); otherwise send a fresh invite.
  const { data: existing } = await admin
    .from('members')
    .select('user_id')
    .eq('email', req.email)
    .maybeSingle()

  if (existing) {
    const { error } = await admin
      .from('members')
      .update({ status: 'active', full_name: req.name, organization: req.organization })
      .eq('email', req.email)
    if (error) return { error: error.message }
  } else {
    const invited = await inviteMember({
      email: req.email,
      invitedBy: gate.userId,
      fullName: req.name,
      organization: req.organization,
    })
    if (!invited.ok) return { error: invited.error }
  }

  await admin
    .from('access_requests')
    .update({ status: 'approved', reviewed_by: gate.userId, reviewed_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/admin')
  return OK
}

/** Deny a still-pending request. */
export async function denyAccessRequest(id: string): Promise<AccessRequestState> {
  const gate = await requireAdmin()
  if (!gate.ok) return { error: gate.error }
  const admin = createSupabaseAdminClient()
  const { error } = await admin
    .from('access_requests')
    .update({ status: 'denied', reviewed_by: gate.userId, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return OK
}

/** Soft-revoke a visitor (status → 'revoked'). Admins cannot be revoked. */
export async function revokeVisitor(userId: string): Promise<AccessRequestState> {
  const gate = await requireAdmin()
  if (!gate.ok) return { error: gate.error }
  const admin = createSupabaseAdminClient()

  const { data: target } = await admin
    .from('members')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()
  if (!target) return { error: 'Member not found.' }
  if (target.role === 'admin') return { error: 'Admins cannot be revoked.' }

  const { error } = await admin.from('members').update({ status: 'revoked' }).eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return OK
}

/** Re-instate a revoked visitor (status → 'active'). */
export async function reinstateVisitor(userId: string): Promise<AccessRequestState> {
  const gate = await requireAdmin()
  if (!gate.ok) return { error: gate.error }
  const admin = createSupabaseAdminClient()
  const { error } = await admin
    .from('members')
    .update({ status: 'active' })
    .eq('user_id', userId)
    .eq('status', 'revoked')
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return OK
}
