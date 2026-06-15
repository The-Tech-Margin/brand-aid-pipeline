// Internal run token — an HMAC over the runId keyed by the service-role secret.
// Lets a chunked run self-chain via server-to-server fetch without forwarding the
// user's cookies. The runId is an unguessable UUID and the secret never leaves the
// server, so a valid token proves the request came from our own step trigger.
import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '@/config/env'

export function signRunToken(runId: string): string {
  return createHmac('sha256', env.supabaseServiceRoleKey()).update(runId).digest('hex')
}

export function verifyRunToken(runId: string, token: string | null): boolean {
  if (!token) return false
  const expected = Buffer.from(signRunToken(runId))
  const actual = Buffer.from(token)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
