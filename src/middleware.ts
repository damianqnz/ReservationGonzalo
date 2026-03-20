import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const session = await auth()
  const role = session?.user?.role
  const email = session?.user?.email
  const path = request.nextUrl.pathname

  // ── Protect /dashboard and its sub-routes ──────────────────────────────────
  if (path.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (role !== 'OWNER' && role !== 'ADMIN') {
      const portalUrl = email
        ? `/portal?email=${encodeURIComponent(email)}`
        : '/portal'
      return NextResponse.redirect(new URL(portalUrl, request.url))
    }
  }

  // ── Auto-redirect authenticated users away from /login ────────────────────
  if (path === '/login' && session) {
    if (role === 'OWNER' || role === 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    const portalUrl = email
      ? `/portal?email=${encodeURIComponent(email)}`
      : '/portal'
    return NextResponse.redirect(new URL(portalUrl, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
