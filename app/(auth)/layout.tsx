import type { ReactNode } from 'react'

// Auth pages manage their own full-screen split layout
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
