import './site-footer.css'
import Image from 'next/image'
import Link from 'next/link'
import logoLightSrc from '@/public/logo-light.png'

const LINK_COLS = [
  {
    heading: 'Formations',
    links: [
      { label: 'Développement Web',     href: '/#formations' },
      { label: 'Data Science & IA',     href: '/#formations' },
      { label: 'Business & Management', href: '/#formations' },
      { label: 'Design UX/UI',          href: '/#formations' },
    ],
  },
  {
    heading: 'MIA',
    links: [
      { label: 'Qui sommes-nous', href: '/#pourquoi'     },
      { label: 'Certifications',  href: '/#financements' },
      { label: 'Financements',    href: '/#financements' },
      { label: 'Témoignages',     href: '/#temoignages'  },
    ],
  },
]

export default function SiteFooter() {
  return (
    <footer className="sf-root">
      <div className="sf-inner">
        <div className="sf-grid">

          {/* Brand */}
          <div>
            <Link href="/">
              <Image src={logoLightSrc} alt="MIA Formation" width={44} height={44} className="object-contain" />
            </Link>
            <p className="sf-tagline">
              Centre de formation professionnelle certifié.<br />Building skills. Shaping futures.
            </p>
          </div>

          {/* Link columns */}
          {LINK_COLS.map(({ heading, links }) => (
            <div key={heading}>
              <p className="sf-col-heading">{heading}</p>
              <div className="sf-links">
                {links.map(({ label, href }) => (
                  <Link key={label} href={href} className="sf-link">{label}</Link>
                ))}
              </div>
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <p className="sf-col-heading">Newsletter</p>
            <p className="sf-newsletter-sub">Actualités mensuelles sur les compétences.</p>
            <div className="sf-newsletter-row">
              <input className="sf-newsletter-input" placeholder="Email" type="email" />
              <button type="button" className="sf-newsletter-btn">S&apos;abonner</button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="sf-bottom">
          <span className="sf-copy">© {new Date().getFullYear()} MIA Formation. Tous droits réservés.</span>
          <div className="sf-legal">
            <Link href="#" className="sf-legal-link">Confidentialité</Link>
            <Link href="#" className="sf-legal-link">Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
