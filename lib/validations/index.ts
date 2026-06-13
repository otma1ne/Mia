export * from './auth'
export * from './commercial'
export * from './formations'
export * from './vehicles'

import { ZodError } from 'zod'

export function formatValidationError(error: ZodError): string {
  const issues = error.issues.slice(0, 3) // Show first 3 errors
  return issues.map(issue => {
    const field = issue.path.join('.')
    return `${field || 'Erreur'}: ${issue.message}`
  }).join('; ')
}
