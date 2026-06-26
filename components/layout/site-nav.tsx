'use client'

import './site-nav.css'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import logoSrc      from '@/public/logo.png'
import logoLightSrc from '@/public/logo-light.png'
import { ArrowRight, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  ['/#formations',   'Formations'   ],
  ['/#pourquoi',     'Pourquoi MIA' ],
  ['/#financements', 'Financements' ],
  ['/#temoignages',  'Témoignages'  ],
  ['/#contact',      'Contact'      ],
] as const

export default function SiteNav() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav className={`sn-glass${scrolled ? ' sn--visible' : ''}`}>
        <div className="sn-bg" aria-hidden="true" />
        <div className="sn-content mx-auto max-w-[1200px] px-8 py-5 grid items-center">

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <div className="sn-logo-wrap">
              <Image src={logoLightSrc} alt="MIA Digital" fill sizes="40px"
                     className="object-contain sn-logo-light" priority />
              <Image src={logoSrc} alt="" fill sizes="40px"
                     className="object-contain sn-logo-dark" aria-hidden />
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(([href, label]) => (
              <Link key={href} href={href} className="sn-link text-[14px] font-medium">
                {label}
              </Link>
            ))}
          </div>

          {/* Col 3 — CTA on desktop, hamburger on mobile */}
          <div className="flex items-center justify-self-end">
            <Link href="/login"
                  className="sn-btn-primary hidden md:inline-flex items-center gap-2 text-[14px] font-semibold px-5 py-2.5 rounded-[32px] hover:-translate-y-px transition-transform">
              Mon espace <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              className="md:hidden sn-hamburger p-2 rounded-lg"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Dim overlay */}
      <div
        className={`sn-side-overlay${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <div
        className={`sn-side-panel${menuOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
      >
        <div className="sn-side-header">
          <Image src={logoSrc} alt="MIA Digital" width={36} height={36} className="object-contain" />
          <button type="button" className="sn-side-close"
                  onClick={() => setMenuOpen(false)} aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="sn-side-links">
          {NAV_LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="sn-side-link"
                  onClick={() => setMenuOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="sn-side-cta-wrap">
          <Link href="/login" className="sn-side-cta" onClick={() => setMenuOpen(false)}>
            Mon espace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  )
}
