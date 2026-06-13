// In-memory rate limiting (for single-instance deployment)
// For distributed deployments, use Redis-based rate limiting
// Using simple Map with manual cleanup instead of LRUCache dependency
const rateLimit = new Map<string, { timestamps: number[]; createdAt: number }>()

export interface RateLimitConfig {
  interval: number // ms
  maxRequests: number
}

export const RATE_LIMIT_CONFIG = {
  // Auth endpoints: 5 attempts per 15 minutes per IP
  login: { interval: 1000 * 60 * 15, maxRequests: 5 },
  register: { interval: 1000 * 60 * 15, maxRequests: 5 },
  passwordReset: { interval: 1000 * 60 * 60, maxRequests: 3 }, // 3 per hour

  // API endpoints: 100 requests per 15 minutes per IP
  api: { interval: 1000 * 60 * 15, maxRequests: 100 },

  // Upload endpoints: 10 uploads per hour
  upload: { interval: 1000 * 60 * 60, maxRequests: 10 },
}

/**
 * Check if request exceeds rate limit
 * Returns { allowed: boolean, remaining: number, resetTime: Date }
 *
 * ⚠️ In development mode, rate limiting is disabled
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: Date } {
  // Disable rate limiting in development mode
  if (process.env.NODE_ENV === 'development') {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: new Date(Date.now() + config.interval),
    }
  }

  const now = Date.now()
  const entry = rateLimit.get(identifier)

  // Clean up old entries every 100 calls to prevent memory leak
  if (Math.random() < 0.01) {
    const cutoff = now - 1000 * 60 * 60 // 1 hour
    for (const [key, val] of rateLimit.entries()) {
      if (val.createdAt < cutoff) {
        rateLimit.delete(key)
      }
    }
  }

  const timestamps = entry ? [...entry.timestamps] : []

  // Filter out old requests outside the interval
  const recentRequests = timestamps.filter((time: number) => now - time < config.interval)

  const allowed = recentRequests.length < config.maxRequests

  if (allowed) {
    recentRequests.push(now)
  }

  // Update store
  rateLimit.set(identifier, {
    timestamps: recentRequests,
    createdAt: entry?.createdAt ?? now,
  })

  // Calculate reset time
  const oldestRequest = recentRequests[0]
  const resetTime = oldestRequest ? new Date(oldestRequest + config.interval) : new Date(now + config.interval)

  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - recentRequests.length),
    resetTime,
  }
}

/**
 * Get client IP from request
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  const real = headers.get('x-real-ip')
  return forwarded?.split(',')[0] || real || 'unknown'
}
