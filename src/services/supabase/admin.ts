// Service-role Supabase client — SERVER ONLY. Bypasses RLS, so every write must
// set user_id explicitly and callers must scope to the authenticated user. Used
// by the pipeline for persistence and storage uploads.
import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/config/env'
import type { Database } from '@/types/database'

export function createSupabaseAdminClient() {
  return createClient<Database, 'brand_helper'>(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    db: { schema: 'brand_helper' },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
