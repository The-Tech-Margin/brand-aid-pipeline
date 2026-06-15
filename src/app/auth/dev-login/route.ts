// DEV-ONLY sign-in. Bypasses the magic-link email round trip so the local preview can
// reach gated pages without a mail client. It mints a session for a dev email via the
// service role (generateLink) and completes it through the same verifyOtp path as
// /auth/callback. HARD-BLOCKED in production here AND at the proxy (src/proxy.ts) —
// the route never exists in a production build. Default email is the seeded owner;
// override with ?email= (the user must already exist) or DEV_LOGIN_EMAIL.
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { createSupabaseAdminClient } from '@/services/supabase/admin'
import { activateMember } from '@/features/members/activate'

export const dynamic = 'force-dynamic'

const DEFAULT_DEV_EMAIL = 'sonia@thetechmargin.com'

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 })
  }

  const { searchParams, origin } = new URL(request.url)
  const email = (searchParams.get('email') ?? process.env.DEV_LOGIN_EMAIL ?? DEFAULT_DEV_EMAIL)
    .trim()
    .toLowerCase()

  const admin = createSupabaseAdminClient()
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  const tokenHash = link?.properties?.hashed_token
  if (linkError || !tokenHash) {
    return NextResponse.json(
      {
        error: `dev-login: could not generate a link for ${email}`,
        detail: linkError?.message ?? 'no token returned (does the auth user exist?)',
      },
      { status: 400 },
    )
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.verifyOtp({ type: 'email', token_hash: tokenHash })
  if (error || !data.user?.id || !data.user.email) {
    return NextResponse.json(
      { error: 'dev-login: session verification failed', detail: error?.message },
      { status: 400 },
    )
  }

  // Mirror /auth/callback: mark the member active (and bootstrap admins from the DB
  // allowlist) on sign-in.
  await activateMember(data.user.id, data.user.email)
  return NextResponse.redirect(new URL('/dashboard', origin))
}
