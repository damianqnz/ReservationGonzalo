import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const protectedRoutes = ['/dashboard', '/properties', '/bookings', '/settings']

export async function middleware(request: NextRequest) {
  const session = await auth()
  const isLoggedIn = !!session
  const { pathname } = request.nextUrl

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
