import type { Metadata } from 'next'
import HelpContent from '@/components/help-content'

export const metadata: Metadata = { title: 'Aide — MIA Formation' }

export default function AdminHelpPage() {
  return <HelpContent />
}
