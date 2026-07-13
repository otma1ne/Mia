import SiteNav from '@/components/layout/site-nav'
import SiteFooter from '@/components/layout/site-footer'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
      <SiteFooter />
    </>
  )
}
