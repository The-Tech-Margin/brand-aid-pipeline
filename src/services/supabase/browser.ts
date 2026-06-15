// Browser Supabase client (anon key only). Used by client components for auth
// flows; data access still goes through RLS as the signed-in user.
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database, 'brand_helper'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: 'brand_helper' } },
  )
}
