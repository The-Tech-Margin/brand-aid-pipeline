// Auth confirm — handles the magic-link / invite email redirect.
// Supabase appends ?token_hash=…&type=magiclink to the emailRedirectTo URL,
// so this route receives those params cleanly (no pre-existing query string).
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { activateMember } from '@/features/members/activate'
import { getURL, isAppOrigin } from '@/lib/get-url'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = (searchParams.get('type') as EmailOtpType | null) ?? 'email'
  const next = searchParams.get('next') ?? '/dashboard'

  const base = isAppOrigin(origin) ? origin : getURL()

  if (tokenHash) {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

    if (!error && data.user?.id && data.user?.email) {
      const { activated } = await activateMember(data.user.id, data.user.email)
      return NextResponse.redirect(new URL(activated ? next : '/no-access', base))
    }
  }

  // Verification failed or no token present — back to login with a notice.
  return NextResponse.redirect(new URL('/login?error=link', base))
}
