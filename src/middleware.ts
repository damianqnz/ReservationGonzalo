import { auth } from '@/lib/auth'

const protectedRoutes = ['/dashboard', '/properties', '/bookings', '/settings']

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !isLoggedIn) {
    return Response.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
