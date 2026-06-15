// Next 16 proxy (replaces middleware) — runs at the network edge to refresh the
// Supabase session and optimistically redirect unauthenticated users. Authoritative
// access control lives in src/app/(app)/layout.tsx.
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/services/supabase/proxy-session'

export async function proxy(request: NextRequest) {
  // Dev-only sign-in must never be reachable in production — block it here, at the
  // proxy, in addition to the route's own NODE_ENV guard.
  if (
    process.env.NODE_ENV === 'production' &&
    request.nextUrl.pathname.startsWith('/auth/dev-login')
  ) {
    return new NextResponse('Not found', { status: 404 })
  }
  return updateSession(request)
}

export const config = {
  // Run on app routes, skipping static assets and image optimization.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|fonts/|.*\\.(?:png|jpg|jpeg|svg|ico)$).*)',
  ],
}
