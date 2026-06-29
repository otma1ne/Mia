import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow root, static assets, and Next.js internals
  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/health')
  ) {
    return NextResponse.next()
  }

  // Redirect everything else to coming soon
  return NextResponse.redirect(new URL('/', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
