import 'server-only'

// Best-effort client IP from proxy headers, used only as a rate-limit key (it is
// hashed before storage, never persisted raw — see rate-limit.ts).
import { headers } from 'next/headers'

export async function clientIp(): Promise<string> {
  const h = await headers()
  return (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? 'unknown').trim()
}
