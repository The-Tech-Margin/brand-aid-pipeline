// Sign-in page. Forwards any magic-link/invite verification token to the callback
// route (a page render can't set the session cookie), otherwise shows the
// magic-link form. Already-active members are sent straight into the app.
import { redirect } from 'next/navigation'
import { LoginForm } from '@/features/auth/components/login-form'
import { createSupabaseServerClient } from '@/services/supabase/server'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    redirect?: string
    token_hash?: string
    type?: string
    code?: string
    error?: string
  }>
}) {
  const params = await searchParams
  const redirectParam = params.redirect
  const redirectTo =
    redirectParam?.startsWith('/') &&
    !redirectParam.startsWith('/login') &&
    !redirectParam.startsWith('/no-access')
      ? redirectParam
      : '/dashboard'

  // Depending on the Supabase email template, a magic-link/invite can land here
  // carrying the verification token. Hand it to the callback route, which verifies
  // it and writes the session cookie before redirecting.
  if (params.token_hash || params.code) {
    const qs = new URLSearchParams()
    if (params.token_hash) qs.set('token_hash', params.token_hash)
    if (params.type) qs.set('type', params.type)
    if (params.code) qs.set('code', params.code)
    qs.set('redirect', redirectTo)
    redirect(`/auth/callback?${qs.toString()}`)
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    // Active members continue to their destination; signed-in non-members go to
    // the invite-only notice (avoids bouncing them back through the (app) gate).
    const { data: membership } = await supabase
      .from('members')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()
    redirect(membership?.status === 'active' ? redirectTo : '/no-access')
  }

  return (
    <main id="content" className="flex flex-1 items-center justify-center px-4 py-16">
      <div
        className="border-border bg-card w-full max-w-sm border p-6"
        style={{ borderRadius: 'var(--radius-lg)' }}
      >
        <h1 className="mb-1 text-2xl leading-[1.4] font-semibold">
          <span className="gradient-text">Sign in</span>
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Access the Brand Helper creative pipeline.
        </p>
        {params.error === 'link' && (
          <p role="alert" className="text-brand-hot-red mb-4 text-sm">
            That sign-in link was invalid or expired. Request a new one below.
          </p>
        )}
        <LoginForm redirectTo={redirectTo} />
        {process.env.NODE_ENV !== 'production' && (
          <p className="border-border text-muted-foreground mt-6 border-t pt-4 text-xs">
            <a
              href="/auth/dev-login"
              className="text-brand-cyan hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ borderRadius: 'var(--radius)' }}
            >
              Dev sign-in (local only)
            </a>{' '}
            — bypasses the magic link for local preview.
          </p>
        )}
      </div>
    </main>
  )
}
