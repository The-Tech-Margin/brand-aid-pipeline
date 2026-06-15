// Session refresh + optimistic auth redirect for the Next 16 proxy. Keeps tokens
// fresh and bounces unauthenticated requests off protected paths. The real
// data-level guard is the (app) Server Layout — this is the fast network edge.
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { env } from '@/config/env'
import type { Database } from '@/types/database'

const PROTECTED_PREFIXES = ['/dashboard', '/runs', '/creatives', '/themes']

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database, 'brand_helper'>(
    env.supabaseUrl(),
    env.supabaseAnonKey(),
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return response
}
