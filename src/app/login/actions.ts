'use server'

// Magic-link sign-in. Access is invite-only, so we use shouldCreateUser: false —
// only already-invited users receive a link. The request runs through this
// rate-limited server action, and the result is intentionally generic so it never
// reveals whether an email is on the invite list.
import { createSupabaseServerClient } from '@/services/supabase/server'
import { checkLoginRateLimit } from '@/features/auth/rate-limit'
import { clientIp } from '@/features/auth/client-ip'
import { getURL } from '@/lib/get-url'

export interface AuthState {
  error?: string
  sent?: boolean
}

export async function requestMagicLink(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()

  if (!email) return { error: 'Enter your email address.' }

  const { allowed } = await checkLoginRateLimit(await clientIp())
  if (!allowed) {
    return { error: 'Too many attempts. Please wait a few minutes and try again.' }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${getURL()}auth/confirm`,
    },
  })

  // Log server-side for debugging, but always report the same generic result so we
  // never reveal whether the email belongs to an invited member.
  if (error) console.error('[auth] magic-link request failed:', error.message)
  return { sent: true }
}
