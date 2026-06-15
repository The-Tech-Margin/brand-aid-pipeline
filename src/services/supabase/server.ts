// Server-side Supabase client bound to the request's auth cookies. Runs as the
// signed-in user, so RLS applies. Use for auth checks and user-scoped reads.
import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { env } from '@/config/env'
import type { Database } from '@/types/database'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient<Database, 'brand_helper'>(env.supabaseUrl(), env.supabaseAnonKey(), {
    db: { schema: 'brand_helper' },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component render — cookies are read-only here.
          // The proxy/route handler refreshes the session cookie instead.
        }
      },
    },
  })
}
