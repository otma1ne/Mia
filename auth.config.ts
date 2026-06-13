import type { NextAuthConfig } from 'next-auth'
import type { UserRole } from '@prisma/client'

// Edge-compatible auth config (no Prisma/Node.js imports)
// Used by middleware and extended by auth.ts with full Prisma integration
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },

  // ────────────────────────────────────────
  // Session Configuration
  // ────────────────────────────────────────
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours - force re-login daily
    updateAge: 60 * 60, // Update token every hour
  },

  // ────────────────────────────────────────
  // JWT Configuration
  // ────────────────────────────────────────
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },

  // ────────────────────────────────────────
  // CSRF and Security
  // ────────────────────────────────────────
  useSecureCookies: process.env.NODE_ENV === 'production',
  trustHost: true, // Trust X-Forwarded-Proto header (for reverse proxies)

  providers: [], // providers are added in auth.ts

  callbacks: {
    // ────────────────────────────────────────
    // JWT Callback - runs when token is created/updated
    // ────────────────────────────────────────
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as { role: UserRole }).role
        token.email = user.email
        // Add token creation timestamp for audit
        token.iat = Math.floor(Date.now() / 1000)
      }
      return token
    },

    // ────────────────────────────────────────
    // Session Callback - runs on every client request
    // ────────────────────────────────────────
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as UserRole
      session.user.email = token.email as string
      return session
    },

    // ────────────────────────────────────────
    // Authorized Callback - runs on middleware check
    // Used for additional authorization logic
    // ────────────────────────────────────────
    authorized({ request, auth: authSession }) {
      const { pathname } = request.nextUrl

      // Admin routes - only ADMIN role
      if (pathname.startsWith('/admin')) {
        return authSession?.user.role === 'ADMIN'
      }

      // Trainer routes - ADMIN or TRAINER
      if (pathname.startsWith('/trainer')) {
        return ['ADMIN', 'TRAINER'].includes(authSession?.user.role || '')
      }

      // Student routes - any authenticated user
      if (pathname.startsWith('/student')) {
        return !!authSession
      }

      // Commercial routes - COMMERCIAL only
      if (pathname.startsWith('/commercial')) {
        return authSession?.user.role === 'COMMERCIAL'
      }

      return true
    },
  },
}
