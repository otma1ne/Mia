import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import logoSrc from '@/public/logo.png'

export const metadata: Metadata = {
  robots: { index: true, follow: true },
}

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f8fa', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif" }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #eef0f3', padding: '20px 36px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Image src={logoSrc} alt="MIA Académie" width={32} height={32} style={{ objectFit: 'contain' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#17171C', letterSpacing: '-0.01em' }}>MIA Académie</span>
        </Link>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
        {children}
      </main>

      <footer style={{ background: '#fff', borderTop: '1px solid #eef0f3', padding: '20px 36px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
          © {new Date().getFullYear()} MIA Académie ·{' '}
          <Link href="/legal/terms" style={{ color: '#6B2BD9', textDecoration: 'none' }}>Conditions d&apos;utilisation</Link>
          {' · '}
          <Link href="/legal/privacy" style={{ color: '#6B2BD9', textDecoration: 'none' }}>Politique de confidentialité</Link>
        </p>
      </footer>
    </div>
  )
}
