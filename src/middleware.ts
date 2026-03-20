import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const protectedRoutes = ['/dashboard', '/properties', '/bookings', '/settings']

export async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.nextUrl))
    }

    const role = session.user?.role
    if (role !== 'OWNER' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.nextUrl))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}