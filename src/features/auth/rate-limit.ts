// DB-backed rate limiter. In-memory counters don't survive serverless cold starts, so
// attempts are counted in Supabase. The key is a salted SHA-256 of the namespace + IP —
// the raw IP is never stored (per the security rules). A namespace gives each entry point
// (login, access-request, …) its own non-colliding keyspace on the same login_attempts table.
import 'server-only'
import { createHash } from 'node:crypto'
import { createSupabaseAdminClient } from '@/services/supabase/admin'
import { env } from '@/config/env'

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 10

function attemptKey(namespace: string, ip: string): string {
  return createHash('sha256')
    .update(`${namespace}:${ip}:${env.supabaseServiceRoleKey()}`)
    .digest('hex')
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
}

export interface RateLimitOptions {
  windowMs?: number
  maxAttempts?: number
}

/** Count one attempt for (namespace, IP); deny once the window limit is exceeded. */
export async function checkRateLimit(
  namespace: string,
  ip: string,
  opts: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const windowMs = opts.windowMs ?? WINDOW_MS
  const max = opts.maxAttempts ?? MAX_ATTEMPTS
  const db = createSupabaseAdminClient()
  const key = attemptKey(namespace, ip)
  const windowStart = new Date(Date.now() - windowMs).toISOString()

  const { count } = await db
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('attempt_key', key)
    .gte('window_start', windowStart)

  const attempts = count ?? 0
  if (attempts >= max) return { allowed: false, remaining: 0 }

  await db.from('login_attempts').insert({ attempt_key: key })
  return { allowed: true, remaining: max - attempts - 1 }
}

/** Login limiter (namespace 'login', default window/limit). */
export async function checkLoginRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit('login', ip)
}
