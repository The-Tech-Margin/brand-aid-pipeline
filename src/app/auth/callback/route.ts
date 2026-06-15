// Auth callback — completes a sign-in from a magic link / invite / email
// confirmation and lands the user on `redirect`. Handles both flows:
//   • token_hash + type  → verifyOtp   (magic link / invite / OTP)
//   • code               → exchangeCodeForSession  (OAuth / PKCE code)
// Runs as a route handler (not a page) so the session cookie can be written.
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { activateMember } from '@/features/members/activate'
import { getURL, isAppOrigin } from '@/lib/get-url'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = (searchParams.get('type') as EmailOtpType | null) ?? 'email'
  const redirectParam = searchParams.get('redirect') ?? searchParams.get('next')
  // Open-redirect guard: only a same-site relative path (reject //host and absolute).
  const next =
    redirectParam?.startsWith('/') && !redirectParam.startsWith('//') ? redirectParam : '/dashboard'

  // Land the user on one of OUR origins. In the shared Supabase project a magic link
  // can resolve to another app's host; if it did, send them to the canonical app
  // rather than leaving them there. Keep the current origin when it's ours so the
  // session cookie just written on this domain still applies.
  const base = isAppOrigin(origin) ? origin : getURL()

  const supabase = await createSupabaseServerClient()

  let userId: string | undefined
  let userEmail: string | undefined
  let ok = false

  if (tokenHash) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    ok = !error
    userId = data.user?.id
    userEmail = data.user?.email ?? undefined
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    ok = !error
    userId = data.user?.id
    userEmail = data.user?.email ?? undefined
  }

  if (ok && userId && userEmail) {
    // Mark the member active on first sign-in (and bootstrap admins from the DB
    // allowlist). Uninvited, non-admin sign-ins are denied — send them to no-access
    // rather than bouncing through the gated app.
    const { activated } = await activateMember(userId, userEmail)
    return NextResponse.redirect(new URL(activated ? next : '/no-access', base))
  }

  // Verification failed or no token present — back to login with a notice.
  return NextResponse.redirect(new URL('/login?error=link', base))
}
