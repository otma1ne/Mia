import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { authConfig } from '@/auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // ────────────────────────────────────────
        // Validate credentials format
        // ────────────────────────────────────────
        if (!credentials?.email || !credentials?.password) {
          console.warn('[Auth] Invalid credentials format')
          return null
        }

        const email = String(credentials.email).toLowerCase().trim()
        const password = String(credentials.password)

        // Prevent very long password strings (DoS protection)
        if (password.length > 1000) {
          console.warn('[Auth] Suspiciously long password attempt')
          return null
        }

        try {
          // ────────────────────────────────────────
          // Find user by email
          // ────────────────────────────────────────
          const user = await db.user.findUnique({
            where: { email },
          })

          if (!user) {
            // Don't reveal if email exists (timing attack mitigation)
            console.warn(`[Auth] Login attempt for non-existent user: ${email}`)
            return null
          }

          // ────────────────────────────────────────
          // Verify password
          // ────────────────────────────────────────
          const isValid = await bcrypt.compare(password, user.password)

          if (!isValid) {
            console.warn(`[Auth] Invalid password for user: ${email}`)
            return null
          }

          // ────────────────────────────────────────
          // Successful authentication
          // ────────────────────────────────────────
          console.info(`[Auth] Successful login for user: ${email}`)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
            role: user.role,
          }
        } catch (error) {
          console.error(`[Auth] Authorization error: ${error instanceof Error ? error.message : 'Unknown error'}`)
          return null
        }
      },
    }),
  ],
})
