import type { Metadata } from 'next'
import HelpContent from '@/components/help-content'

export const metadata: Metadata = { title: 'Aide — EduDrive' }

export default function StudentHelpPage() {
  return <HelpContent />
}
