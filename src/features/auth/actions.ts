'use server'

// Server actions for auth lifecycle.
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/services/supabase/server'

export async function signOut() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
