import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Use Edge-compatible config (no Prisma) for route protection
const { auth } = NextAuth(authConfig)

const publicRoutes = ['/', '/courses']
const authRoutes = ['/login', '/register']
const publicPrefixes = ['/evaluation', '/signature']

// ────────────────────────────────────────
// Security Headers Configuration
// ────────────────────────────────────────
const securityHeaders = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection in older browsers
  'X-XSS-Protection': '1; mode=block',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Content Security Policy (strict)
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'accelerometer=()',
    'gyroscope=()',
    'magnetometer=()',
  ].join(', '),

  // HSTS - require HTTPS (only in production)
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  }),
}

// ────────────────────────────────────────
// Middleware Handler with Auth & Security
// ────────────────────────────────────────
export default auth((req: NextRequest & { auth: any }) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isAuthRoute = authRoutes.some(r => nextUrl.pathname.startsWith(r))
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname) || publicPrefixes.some(p => nextUrl.pathname.startsWith(p))

  // ────────────────────────────────────────
  // PROTECTION: Redirect authenticated users away from auth routes
  // ────────────────────────────────────────
  if (isAuthRoute && isLoggedIn) {
    // Redirect to role-appropriate dashboard
    const userRole = (req.auth?.user?.role || 'STUDENT') as string
    const dashboardUrls: Record<string, string> = {
      ADMIN:      '/admin/dashboard',
      TRAINER:    '/trainer/dashboard',
      STUDENT:    '/student/dashboard',
      COMMERCIAL: '/commercial/dashboard',
    }

    const dashboardUrl = dashboardUrls[userRole] || '/dashboard'
    return NextResponse.redirect(new URL(dashboardUrl, nextUrl))
  }

  // ────────────────────────────────────────
  // Allow public routes through
  // ────────────────────────────────────────
  if (isPublicRoute) {
    const response = NextResponse.next()
    applySecurityHeaders(response)
    return response
  }

  // ────────────────────────────────────────
  // PROTECTION: Redirect unauthenticated users to login
  // ────────────────────────────────────────
  if (!isLoggedIn && !isAuthRoute) {
    const loginUrl = new URL('/login', nextUrl)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ────────────────────────────────────────
  // PROTECTION: Enforce role-based access control
  // ────────────────────────────────────────
  if (nextUrl.pathname.startsWith('/admin') && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', nextUrl))
  }

  if (
    nextUrl.pathname.startsWith('/trainer') &&
    !['ADMIN', 'TRAINER'].includes(req.auth?.user?.role || '')
  ) {
    return NextResponse.redirect(new URL('/unauthorized', nextUrl))
  }

  if (
    nextUrl.pathname.startsWith('/commercial') &&
    req.auth?.user?.role !== 'COMMERCIAL'
  ) {
    return NextResponse.redirect(new URL('/unauthorized', nextUrl))
  }

  const response = NextResponse.next()
  applySecurityHeaders(response)
  return response
})

/**
 * Apply security headers to response
 */
function applySecurityHeaders(response: NextResponse) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
}

export const config = {
  matcher: [
    '/((?!api/auth|api/cron|api/debug|api/upload-cv|api/webhooks|_next/static|_next/image|favicon.ico|mockup.html).*)',
  ],
}
