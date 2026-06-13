'use server'

import { signIn, signOut } from '@/auth'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { loginSchema, registerSchema } from '@/lib/validations/auth'
import { headers } from 'next/headers'
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIG } from '@/lib/rate-limit'

// ─────────────────────────────────────────
// Login with rate limiting
// ─────────────────────────────────────────

export async function login(_prevState: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const password = formData.get('password') as string

  // ────────────────────────────────────────
  // Rate limiting: max 5 attempts per 15 minutes
  // ────────────────────────────────────────
  const headersList = await headers()
  const clientIp = getClientIp(headersList)
  const rateLimitKey = `login:${clientIp}`

  const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIG.login)
  if (!rateLimit.allowed) {
    console.warn(`[Auth] Rate limit exceeded for login from IP: ${clientIp}`)
    return {
      error: `Too many login attempts. Please try again after ${rateLimit.resetTime.toLocaleTimeString()}.`,
    }
  }

  // ────────────────────────────────────────
  // Validate input with Zod schema
  // ────────────────────────────────────────
  try {
    const validatedData = loginSchema.parse({ email, password })

    // ────────────────────────────────────────
    // Attempt sign in
    // ────────────────────────────────────────
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirectTo: '/dashboard',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      console.warn(`[Auth] Login failed for email: ${email}`)
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid email or password.' }
        default:
          return { error: 'Authentication failed. Please try again.' }
      }
    }
    // Zod validation error
    if (error instanceof Error && error.name === 'ZodError') {
      return { error: 'Invalid email or password format.' }
    }
    throw error // rethrow redirect
  }
}

// ─────────────────────────────────────────
// Register with rate limiting
// ─────────────────────────────────────────

export async function register(_prevState: unknown, formData: FormData) {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // ────────────────────────────────────────
  // Rate limiting: max 5 signups per 15 minutes per IP
  // ────────────────────────────────────────
  const headersList = await headers()
  const clientIp = getClientIp(headersList)
  const rateLimitKey = `register:${clientIp}`

  const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIG.register)
  if (!rateLimit.allowed) {
    console.warn(`[Auth] Rate limit exceeded for registration from IP: ${clientIp}`)
    return {
      error: `Too many registration attempts. Please try again after ${rateLimit.resetTime.toLocaleTimeString()}.`,
    }
  }

  // ────────────────────────────────────────
  // Validate input with Zod schema
  // ────────────────────────────────────────
  try {
    const validatedData = registerSchema.parse({
      name,
      email,
      password,
      confirmPassword,
    })

    // ────────────────────────────────────────
    // Check if email already exists
    // ────────────────────────────────────────
    const existing = await db.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existing) {
      console.warn(`[Auth] Registration attempt for existing email: ${email}`)
      return { error: 'An account with this email already exists.' }
    }

    // ────────────────────────────────────────
    // Create user with hashed password
    // ────────────────────────────────────────
    const hashedPassword = await hashPassword(validatedData.password)

    const newUser = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: 'STUDENT', // new registrations are students by default
      },
    })

    console.info(`[Auth] New user registered: ${email}`)

    // ────────────────────────────────────────
    // Sign in immediately after registration
    // ────────────────────────────────────────
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirectTo: '/dashboard',
    })
  } catch (error) {
    // Zod validation error
    if (error instanceof Error && error.name === 'ZodError') {
      console.warn(`[Auth] Registration validation error: ${error.message}`)
      return { error: error.message || 'Invalid registration data.' }
    }

    if (error instanceof AuthError) {
      console.warn(`[Auth] Registration sign-in failed`)
      return { error: 'Account created but sign-in failed. Please log in.' }
    }

    if (error instanceof Error) {
      console.error(`[Auth] Registration error: ${error.message}`)
      return { error: 'Registration failed. Please try again.' }
    }

    throw error // rethrow redirect
  }
}

// ─────────────────────────────────────────
// Logout
// ─────────────────────────────────────────

export async function logout() {
  await signOut({ redirectTo: '/login' })
}

// ─────────────────────────────────────────
// Redirect to role-specific dashboard
// ─────────────────────────────────────────

export async function redirectToDashboard(role: string) {
  switch (role) {
    case 'ADMIN':
      redirect('/admin/dashboard')
    case 'TRAINER':
      redirect('/trainer/dashboard')
    default:
      redirect('/student/dashboard')
  }
}
