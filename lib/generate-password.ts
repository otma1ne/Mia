import crypto from 'crypto'

// 12-char alphanumeric password, no ambiguous chars (0/O, 1/l/I)
export function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.randomBytes(12)
  return Array.from(bytes).map(b => chars[b % chars.length]).join('')
}
