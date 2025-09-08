import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const protectedRoutes = ['/', '/dashboard', '/scan']
const authRoutes = ['/login']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some(route => path === route || (route !== '/' && path.startsWith(route)))
  const isAuthRoute = authRoutes.some(route => path.startsWith(route))
  
  const token = request.cookies.get('admin-token')?.value

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const payload = verifyToken(token)
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('admin-token')
      return response
    }
  }

  if (isAuthRoute && token) {
    const payload = verifyToken(token)
    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/scan/:path*',
    '/login',
  ]
}