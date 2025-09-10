import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const protectedRoutes = ['/', '/dashboard', '/scan']
const protectedApiRoutes = ['/api/check-in', '/api/users']
const authRoutes = ['/login']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some(route => path === route || (route !== '/' && path.startsWith(route)))
  const isProtectedApiRoute = protectedApiRoutes.some(route => path.startsWith(route))
  const isAuthRoute = authRoutes.some(route => path.startsWith(route))
  
  const token = request.cookies.get('admin-token')?.value

  // Check protected page routes and API routes
  if (isProtectedRoute || isProtectedApiRoute) {
    if (!token) {
      // For API routes, return 401 instead of redirect
      if (isProtectedApiRoute) {
        return NextResponse.json(
          { error: 'Unauthorized - No token provided' },
          { status: 401 }
        )
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const payload = verifyToken(token)
    if (!payload) {
      console.log('Token verification failed for token:', token.substring(0, 20) + '...')
      console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET)
      console.log('NODE_ENV:', process.env.NODE_ENV)
      // For API routes, return 401 instead of redirect
      if (isProtectedApiRoute) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid token' },
          { status: 401 }
        )
      }
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
    '/api/check-in/:path*',
    '/api/users/:path*',
  ]
}