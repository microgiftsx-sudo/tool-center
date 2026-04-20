import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register']

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('accessToken')?.value

  // Check if route is public (no auth required)
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  
  // If user has token and tries to access auth pages, redirect to home
  // if (isPublicRoute && token) {
  //   return NextResponse.redirect(new URL('/', request.url))
  // }

  // If user doesn't have token and tries to access protected routes, redirect to login
  // if (!isPublicRoute && !token) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ]
}