// Server Layout Guard — the authoritative auth boundary for the gated app.
// Validates the session against the auth server (getUser) on every protected
// render; RLS enforces per-user data isolation underneath.
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/services/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Invite-only: a valid session isn't enough — the user must be an active member.
  const { data: membership } = await supabase
    .from('members')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!membership || membership.status !== 'active') redirect('/no-access')

  return (
    <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      {children}
    </main>
  )
}
