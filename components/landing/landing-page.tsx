'use client'

import './landing.css'
import { useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import logoSrc      from '@/public/logo.png'
import logoLightSrc from '@/public/logo-light.png'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import {
  ArrowRight, MapPin, Phone, Mail, Clock, Star,
  ChevronLeft, ChevronRight, CheckCircle2, BookOpen,
  Menu, X,
} from 'lucide-react'
import WaitlistForm from '@/components/landing/waitlist-form'

gsap.registerPlugin(ScrollTrigger)

export interface LandingCategory {
  name: string
  description: string
  count: number
}

export interface LandingFormation {
  id: string
  title: string
  description: string
  categoryName: string
  type: 'PRESENTIAL' | 'REMOTE_LIVE' | 'REMOTE_ASYNC'
  price: number | null
  duration: number | null
  thumbnail: string | null
  enrollmentCount: number
  moduleCount: number
}

const FORMATION_TYPE_LABELS: Record<string, string> = {
  PRESENTIAL:   'Présentiel',
  REMOTE_LIVE:  'En ligne (Live)',
  REMOTE_ASYNC: 'En ligne (Async)',
}


const STATS = [
  { n: '850+',  label: 'Étudiants formés'    },
  { n: '94 %',  label: "Taux d'insertion"    },
  { n: '28+',   label: 'Formateurs certifiés' },
]

const PILLARS = [
  {
    n: '01',
    title: 'Formateurs experts & certifiés',
    desc: 'Nos formateurs sont des professionnels actifs, certifiés et reconnus. Ils apportent une expertise terrain directement applicable en entreprise.',
    kpis: [
      { end: 28,  suffix: '+',   label: 'formateurs certifiés' },
      { end: 9.5, suffix: '/10', label: 'satisfaction moyenne' },
    ],
  },
  {
    n: '02',
    title: 'Programmes certifiants reconnus',
    desc: "Tous nos programmes sont éligibles CPF et reconnus par les organismes officiels. Vos certifications ouvrent des portes sur le marché du travail.",
    kpis: [
      { end: 850, suffix: '+', label: 'certifications délivrées' },
      { end: 80,  suffix: '+', label: 'partenaires entreprises'  },
    ],
  },
  {
    n: '03',
    title: 'Résultats concrets & mesurables',
    desc: "94 % de nos étudiants trouvent un emploi dans les 6 mois. Nous accompagnons chaque apprenant jusqu'à l'insertion professionnelle.",
    kpis: [
      { end: 94, suffix: '%',     label: "taux d'insertion pro"  },
      { end: 6,  suffix: ' mois', label: 'délai moyen insertion' },
    ],
  },
]

const CERTS = ['Qualiopi', 'RNCP', 'CPF éligible', 'OPCO', 'Microsoft', 'AWS']

const FINANCEMENTS = [
  { n: '01', title: 'CPF',              detail: "Jusqu'à 5 000 €"        },
  { n: '02', title: 'OPCO / Employeur', detail: 'Prise en charge totale' },
  { n: '03', title: 'Pôle Emploi',      detail: 'AIF disponible'          },
  { n: '04', title: 'Autofinancement',  detail: 'Paiement en 3×'          },
]

const TESTIMONIALS = [
  {
    name: 'Yasmine B.', role: 'Développeuse Web · Promo 2025', stars: 5,
    quote: "MIA Digital a transformé mon parcours. En 6 mois j'ai acquis les compétences pour décrocher mon premier emploi de développeuse.",
  },
  {
    name: 'Karim L.', role: 'Data Analyst · Promo 2024', stars: 5,
    quote: "Formation de très haute qualité. L'approche pratique et les certifications reconnues m'ont permis de trouver un poste chez une scale-up parisienne 2 mois après.",
  },
  {
    name: 'Sara M.', role: 'UX Designer · Promo 2025', stars: 5,
    quote: "La plateforme est intuitive, les formateurs experts et le suivi post-formation exceptionnel. Je recommande MIA à tous ceux qui veulent se reconvertir dans le digital.",
  },
]


function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="section-label">{children}</span>
}

// ─── Testimonial carousel ─────────────────────────────────────────────────────
function TestimonialBlock() {
  const [idx, setIdx] = useState(0)
  const t = TESTIMONIALS[idx]
  return (
    <div className="grid items-start gap-14" style={{ gridTemplateColumns: '1fr 280px' }}>
      <div>
        <div className="flex gap-1 mb-8">
          {Array.from({ length: t.stars }).map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-current" style={{ color: 'var(--text-accent)' }} />
          ))}
        </div>
        <blockquote
          className="font-heading leading-[1.35] mb-10 tracking-[-0.02em]"
          style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', color: 'var(--text-strong)', fontWeight: 400 }}
        >
          &ldquo;{t.quote}&rdquo;
        </blockquote>
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-bold text-white shrink-0"
               style={{ background: 'linear-gradient(135deg, var(--mia-violet), var(--mia-purple))' }}>
            {t.name[0]}
          </div>
          <div>
            <p className="font-semibold text-[14px]" style={{ color: 'var(--text-strong)' }}>{t.name}</p>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{t.role}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col justify-between h-full min-h-[200px] pl-10"
           style={{ borderLeft: '1px solid var(--border-default)' }}>
        <div className="flex flex-col">
          {TESTIMONIALS.map((ti, i) => (
            <button key={ti.name} type="button" onClick={() => setIdx(i)}
                    className="text-left py-4 transition-colors"
                    style={{ borderBottom: '1px solid var(--border-default)' }}>
              <p className="text-[14px] font-semibold transition-colors"
                 style={{ color: i === idx ? 'var(--text-accent)' : 'var(--text-muted)' }}>
                {ti.name}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {ti.role.split('·')[1]?.trim()}
              </p>
            </button>
          ))}
        </div>
        <div className="flex gap-2 pt-4">
          <button type="button" aria-label="Précédent"
                  onClick={() => setIdx((idx - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                  style={{ border: '1px solid var(--border-default)' }}>
            <ChevronLeft className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
          <button type="button" aria-label="Suivant"
                  onClick={() => setIdx((idx + 1) % TESTIMONIALS.length)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                  style={{ border: '1px solid var(--border-default)' }}>
            <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingPage({
  formations,
  categories,
}: {
  formations: LandingFormation[]
  categories: LandingCategory[]
}) {
  const rafRef   = useRef<((time: number) => void) | null>(null)
  const lenisRef = useRef<Lenis | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useLayoutEffect(() => {
    const lenis = new Lenis({ autoRaf: false, lerp: 0.1 })
    lenisRef.current = lenis
    const rafFn = (time: number) => lenis.raf(time * 1000)
    rafRef.current = rafFn
    lenis.on('scroll', (e: { scroll: number }) => {
      ScrollTrigger.update()
      const nav = document.getElementById('site-nav')
      if (nav) nav.classList.toggle('nav--visible', e.scroll > 80)
    })
    gsap.ticker.add(rafFn)
    gsap.ticker.lagSmoothing(0)

    const ctx = gsap.context(() => {
      const isBackNav = window.scrollY > 50

      if (!isBackNav) {
        const show = { opacity: 1, y: 0 }
        gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.7 } })
          .fromTo('#hero-badge',     { y: 18,  opacity: 0 }, { ...show, duration: 0.5 })
          .fromTo('.hero-word',      { y: 72,  opacity: 0 }, { ...show, stagger: 0.08, duration: 0.8 }, '-=0.3')
          .fromTo('#hero-sub',       { y: 22,  opacity: 0 }, { ...show, duration: 0.55 }, '<0.2')
          .fromTo('#hero-ctas',  { y: 14,  opacity: 0 }, { ...show, stagger: 0.1,  duration: 0.45 }, '<0.2')
          .fromTo('#hero-stats > *', { y: 30,  opacity: 0 }, { ...show, stagger: 0.08, duration: 0.6 }, '<0.15')
      } else {
        // Back-navigation: hero already scrolled past — reveal everything immediately
        gsap.set('#hero-badge, .hero-word, #hero-sub, #hero-ctas, #hero-stats > *', { opacity: 1, y: 0 })
      }

      ScrollTrigger.batch('.f-card', {
        start: 'top 88%', once: true, interval: 0.08,
        onEnter: (els) => gsap.fromTo(els,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.7, ease: 'power3.out' },
        ),
      })

      document.querySelectorAll<HTMLElement>('.pillar-row').forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 82%', once: true, refreshPriority: -i } },
        )
      })

      document.querySelectorAll<HTMLElement>('.kpi-val').forEach((el) => {
        const end     = parseFloat(el.dataset.end ?? '0')
        const isFloat = !Number.isInteger(end)
        gsap.to({ v: 0 }, {
          v: end, duration: 2, ease: 'power2.out',
          scrollTrigger: { trigger: '#pourquoi', start: 'top 72%', once: true },
          onUpdate(this: gsap.core.Tween) {
            const v = (this.targets()[0] as { v: number }).v
            el.textContent = isFloat ? v.toFixed(1) : String(Math.floor(v))
          },
        })
      })

      document.querySelectorAll<HTMLElement>('.reveal-up').forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 84%', once: true, refreshPriority: -i } },
        )
      })

      gsap.fromTo('#cta-inner',
        { opacity: 0, y: 56, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: '#cta', start: 'top 78%', once: true } },
      )
    })

    return () => {
      if (rafRef.current) gsap.ticker.remove(rafRef.current)
      lenis.destroy()
      ctx.revert()
    }
  }, [])

  const scrollTo = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    lenisRef.current?.scrollTo(href)
  }

  return (
    <div className="relative overflow-x-clip" style={{ background: 'var(--surface)', color: 'var(--text-body)' }}>

      {/* ══ NAV — transparent over hero, white glass slides in on scroll ════ */}
      <nav id="site-nav" className="nav-glass">
        <div className="nav-bg" aria-hidden="true" />
        <div className="nav-content mx-auto max-w-[1200px] px-8 py-5 grid items-center">

          {/* Logo — light version shown over dark hero, dark on scroll */}
          <Link href="/" className="shrink-0 justify-self-start">
            <div className="logo-wrap">
              <Image src={logoLightSrc} alt="MIA Digital" fill sizes="40px"
                     className="object-contain logo-light" priority />
              <Image src={logoSrc} alt="" fill sizes="40px"
                     className="object-contain logo-dark" aria-hidden />
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {[
              ['#formations',   'Formations'   ],
              ['#pourquoi',     'Pourquoi MIA' ],
              ['#financements', 'Financements' ],
              ['#temoignages',  'Témoignages'  ],
              ['#contact',      'Contact'      ],
            ].map(([href, label]) => (
              <a key={href} href={href}
                 onClick={scrollTo(href)}
                 className="nav-link text-[14px] font-medium">
                {label}
              </a>
            ))}
          </div>

          {/* Col 3 — CTA on desktop, hamburger on mobile (single grid cell) */}
          <div className="flex items-center justify-self-end">
            <Link href="/login"
                  className="nav-btn-primary hidden md:inline-flex items-center gap-2 text-[14px] font-semibold px-5 py-2.5 rounded-[32px] hover:-translate-y-px transition-transform">
              Mon espace <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              className="md:hidden nav-hamburger p-2 rounded-lg"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile side-menu ────────────────────────────────────────────── */}
      {/* Dim overlay */}
      <div
        className={`nav-side-overlay${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      {/* Slide-in panel */}
      <div
        className={`nav-side-panel${menuOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
      >
        <div className="nav-side-header">
          <Image src={logoSrc} alt="MIA Digital" width={36} height={36} className="object-contain" />
          <button type="button" className="nav-side-close" onClick={() => setMenuOpen(false)} aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="nav-side-links">
          {[
            ['#formations',   'Formations'   ],
            ['#pourquoi',     'Pourquoi MIA' ],
            ['#financements', 'Financements' ],
            ['#temoignages',  'Témoignages'  ],
            ['#contact',      'Contact'      ],
          ].map(([href, label]) => (
            <a key={href} href={href}
               onClick={(e) => { scrollTo(href)(e); setMenuOpen(false) }}
               className="nav-side-link">
              {label}
            </a>
          ))}
        </nav>
        <div className="nav-side-cta-wrap">
          <Link href="/login" className="nav-side-cta" onClick={() => setMenuOpen(false)}>
            Mon espace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ══ HERO — dark centered, full-width ════════════════════════════════ */}
      <section id="hero"
               className="relative overflow-hidden text-center px-6 sm:px-8 pt-32 sm:pt-44 pb-16 sm:pb-28"
               style={{ background: 'var(--mia-near-black)', color: '#fff' }}>
        {/* Purple radial glow — top center */}
        <div className="absolute pointer-events-none"
             style={{
               top: -240, left: '50%', transform: 'translateX(-50%)',
               width: 900, height: 780,
               background: 'radial-gradient(ellipse at 50% 20%, rgba(107,43,217,0.6) 0%, rgba(107,43,217,0.18) 45%, transparent 70%)',
             }} />
        {/* Warm glow — bottom right */}
        <div className="absolute pointer-events-none"
             style={{
               bottom: -100, right: -60,
               width: 340, height: 340,
               background: 'radial-gradient(ellipse at center, rgba(255,119,89,0.22) 0%, transparent 70%)',
             }} />

        <div className="relative mx-auto max-w-[820px]">
          {/* Badge */}
          <div id="hero-badge" className="inline-flex items-center gap-2 px-1.5 py-1.5 rounded-full mb-8"
               style={{ border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)' }}>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white"
                  style={{ background: 'var(--mia-purple)' }}>
              EXPERT
            </span>
            <span className="text-[13px] pr-1.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
              <span className="sm:hidden">Certifiés RNCP</span>
              <span className="hidden sm:inline">Formateurs actifs en entreprise, certifiés RNCP</span>
            </span>
          </div>

          {/* H1 */}
          <h1 className="font-heading leading-[1.06] tracking-[-0.03em] mb-6"
              style={{ fontSize: 'clamp(44px, 6.5vw, 92px)', fontWeight: 400 }}>
            <span className="hero-word-wrap"><span className="hero-word text-white">Développez&nbsp;</span></span>
            <span className="hero-word-wrap"><span className="hero-word text-white">vos&nbsp;</span></span>
            <span className="hero-word-wrap"><span className="hero-word text-white">compétences.</span></span>
            <br />
            <span className="hero-word-wrap">
              <span className="hero-word" style={{ color: 'var(--mia-violet)' }}>Façonnez&nbsp;</span>
            </span>
            <span className="hero-word-wrap">
              <span className="hero-word" style={{ color: 'var(--mia-violet)' }}>votre&nbsp;</span>
            </span>
            <span className="hero-word-wrap">
              <span className="hero-word" style={{ color: 'var(--mia-violet)' }}>avenir.</span>
            </span>
          </h1>

          {/* Subtitle */}
          <p id="hero-sub"
             className="text-[17px] leading-[1.75] mb-10 mx-auto max-w-[520px]"
             style={{ color: 'rgba(255,255,255,0.55)' }}>
            MIA Digital accompagne les professionnels dans leur montée en compétences
            grâce à des programmes certifiés et des formateurs experts du terrain.
          </p>

          {/* Waitlist form */}
          <div id="hero-ctas" className="mb-16">
            <WaitlistForm />
          </div>

          {/* Stats with vertical dividers */}
          <div id="hero-stats" className="flex items-center justify-center">
            {STATS.map(({ n, label }, i) => (
              <div key={label} className="flex items-center">
                {i > 0 && (
                  <div className="stat-divider mx-10 shrink-0" style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.14)' }} />
                )}
                <div className="text-center">
                  <div className="font-heading text-[42px] leading-none tracking-[-0.025em] mb-1.5 text-white"
                       style={{ fontWeight: 400 }}>
                    {n}
                  </div>
                  <div className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FORMATIONS — 3-col card grid ══════════════════════════════════════ */}
      {formations.length > 0 && (
        <section id="formations" className="py-24" style={{ background: 'var(--surface)' }}>
          <div className="mx-auto max-w-[1200px] px-8">
            <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
              <div>
                <SectionLabel>Catalogue</SectionLabel>
                <h2 className="font-heading leading-[1.1] tracking-[-0.025em]"
                    style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', color: 'var(--text-strong)', fontWeight: 400 }}>
                  Nos formations
                </h2>
              </div>
              <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                {formations.length} formation{formations.length !== 1 ? 's' : ''} disponible{formations.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {formations.map((f) => (
                <div key={f.id}
                     className="f-card rounded-[16px] overflow-hidden border"
                     style={{ borderColor: 'var(--border-default)', background: 'var(--surface-card)' }}
                     onMouseEnter={e => {
                       const el = e.currentTarget as HTMLElement
                       el.style.transform = 'translateY(-3px)'
                       el.style.borderColor = 'var(--mia-purple)'
                       el.style.boxShadow = 'var(--shadow-md)'
                     }}
                     onMouseLeave={e => {
                       const el = e.currentTarget as HTMLElement
                       el.style.transform = 'none'
                       el.style.borderColor = 'var(--border-default)'
                       el.style.boxShadow = 'none'
                     }}>
                  {/* Media */}
                  <div className="h-32 relative flex items-center justify-center"
                       style={{ background: 'radial-gradient(120% 120% at 80% 0%, var(--mia-violet) 0%, var(--mia-near-black) 100%)' }}>
                    {f.thumbnail
                      ? (
                        <Image
                          src={f.thumbnail}
                          alt={f.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      )
                      : <BookOpen className="w-10 h-10 text-white/30" />
                    }
                    <div className="absolute top-3 left-3">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                        {FORMATION_TYPE_LABELS[f.type]}
                      </span>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-6">
                    <div className="text-[11px] font-bold uppercase tracking-[0.08em] mb-2"
                         style={{ color: 'var(--text-accent)' }}>{f.categoryName}</div>
                    <h3 className="font-heading text-[18px] leading-[1.2] mb-2"
                        style={{ color: 'var(--text-strong)', fontWeight: 400 }}>{f.title}</h3>
                    <p className="text-[14px] leading-[1.65] mb-4 overflow-hidden"
                       style={{ color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as React.CSSProperties['WebkitBoxOrient'] }}>
                      {f.description}
                    </p>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-[12px] font-medium px-3 py-1 rounded-[8px]"
                              style={{ background: 'var(--mia-purple-soft)', color: 'var(--mia-purple-700)' }}>
                          {f.type === 'PRESENTIAL' ? 'Présentiel' : 'En ligne'}
                        </span>
                        {f.duration && (
                          <span className="text-[12px] font-medium px-3 py-1 rounded-[8px] border"
                                style={{ color: 'var(--text-muted)', borderColor: 'var(--border-default)' }}>
                            {f.duration}h
                          </span>
                        )}
                      </div>
                      <Link href={`/formations/${f.id}`}
                            className="text-[13px] font-semibold flex items-center gap-1 transition-all hover:-translate-y-px"
                            style={{ color: 'var(--text-accent)' }}>
                        Plus d&apos;infos <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ À PROPOS ══════════════════════════════════════════════════════════ */}
      <section id="about" className="relative py-28">
        <div className="info-two-col mx-auto max-w-[1200px] px-8 grid gap-20 items-start"
             style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="reveal-up">
            <SectionLabel>Qui sommes-nous ?</SectionLabel>
            <h2 className="font-heading leading-[1.1] tracking-[-0.025em] mb-6"
                style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', color: 'var(--text-strong)', fontWeight: 400 }}>
              MIA Digital,<br />l&apos;académie qui<br />transforme les talents
            </h2>
            <p className="text-[15px] leading-[1.82] mb-5" style={{ color: 'var(--text-muted)' }}>
              MIA Digital est un centre de formation professionnelle certifié Qualiopi.
              Nous croyons que chaque apprenant mérite une formation de qualité, accessible
              et directement opérationnelle.
            </p>
            <p className="text-[15px] leading-[1.82]" style={{ color: 'var(--text-muted)' }}>
              Notre mission : vous donner les compétences pour réussir dans un marché du
              travail en constante évolution.
            </p>
          </div>
          <div className="reveal-up grid grid-cols-2 gap-x-10 gap-y-10">
            {[
              { n: '850+', label: 'Étudiants formés'     },
              { n: '94 %', label: "Taux d'insertion"     },
              { n: '28+',  label: 'Formateurs certifiés' },
              { n: '2019', label: 'Année de fondation'   },
            ].map(({ n, label }) => (
              <div key={label}>
                <div className="font-heading leading-none mb-2 tracking-[-0.04em]"
                     style={{ fontSize: 'clamp(34px, 4vw, 48px)', color: 'var(--text-accent)', fontWeight: 400 }}>
                  {n}
                </div>
                <p className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ POURQUOI MIA ═══════════════════════════════════════════════════════ */}
      <section id="pourquoi" className="relative py-28" style={{ background: 'var(--surface-muted)' }}>
        <div className="mx-auto max-w-[1200px] px-8">
          <SectionLabel>Pourquoi nous choisir ?</SectionLabel>
          <h2 className="font-heading leading-[1.1] tracking-[-0.025em] mb-16 max-w-[580px]"
              style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', color: 'var(--text-strong)', fontWeight: 400 }}>
            La seule académie avec double expertise Conseil &amp; Formation
          </h2>

          {PILLARS.map((p, pidx) => (
            <div key={p.n} className="pillar-row grid items-start py-14"
                 style={{
                   gridTemplateColumns: '110px 1fr 340px',
                   borderTop:    pidx === 0 ? '1px solid var(--border-default)' : undefined,
                   borderBottom: '1px solid var(--border-default)',
                 }}>
              <div className="ghost-n">{p.n}</div>
              <div className="pr-12">
                <p className="text-[19px] font-semibold tracking-[-0.02em] mb-3"
                   style={{ color: 'var(--text-strong)' }}>{p.title}</p>
                <p className="text-[14px] leading-[1.82]" style={{ color: 'var(--text-muted)' }}>{p.desc}</p>
              </div>
              <div className="pillar-kpis grid grid-cols-2 gap-5 pl-10"
                   style={{ borderLeft: '1px solid var(--border-default)' }}>
                {p.kpis.map((k) => (
                  <div key={k.label}>
                    <div className="font-heading leading-none mb-1.5 tracking-[-0.04em]"
                         style={{ fontSize: 'clamp(26px, 3vw, 36px)', color: 'var(--text-strong)', fontWeight: 400 }}>
                      <span className="kpi-val" data-end={k.end}>0</span>
                      <span style={{ color: 'var(--text-accent)' }}>{k.suffix}</span>
                    </div>
                    <div className="text-[12px] leading-[1.5]" style={{ color: 'var(--text-muted)' }}>{k.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CERTIFICATIONS ════════════════════════════════════════════════════ */}
      <section id="certifications" className="relative py-28">
        <div className="info-two-col mx-auto max-w-[1200px] px-8 grid gap-20 items-center"
             style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="reveal-up">
            <SectionLabel>Nos certifications</SectionLabel>
            <h2 className="font-heading leading-[1.1] tracking-[-0.025em] mb-5"
                style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', color: 'var(--text-strong)', fontWeight: 400 }}>
              Certifications reconnues par les professionnels
            </h2>
            <p className="text-[15px] leading-[1.75]" style={{ color: 'var(--text-muted)' }}>
              Nos formations débouchent sur des certifications officiellement reconnues,
              éligibles au CPF et valorisées sur le marché national et international.
            </p>
          </div>
          <div className="reveal-up flex flex-wrap gap-3">
            {CERTS.map(c => (
              <div key={c} className="flex items-center gap-2.5 px-5 py-3 rounded-full"
                   style={{ background: 'var(--surface-accent)', border: '1px solid var(--mia-purple-soft)' }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--text-accent)' }} />
                <span className="text-[14px] font-semibold" style={{ color: 'var(--text-strong)' }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINANCEMENTS ══════════════════════════════════════════════════════ */}
      <section id="financements" className="relative py-28" style={{ background: 'var(--surface-muted)' }}>
        <div className="info-two-col mx-auto max-w-[1200px] px-8 grid gap-20 items-start"
             style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="reveal-up">
            <SectionLabel>Nos financements</SectionLabel>
            <h2 className="font-heading leading-[1.1] tracking-[-0.025em] mb-5"
                style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', color: 'var(--text-strong)', fontWeight: 400 }}>
              Votre formation,<br />sans obstacle financier
            </h2>
            <p className="text-[15px] leading-[1.75] mb-10" style={{ color: 'var(--text-muted)' }}>
              Plusieurs dispositifs sont disponibles pour rendre votre formation accessible
              quelle que soit votre situation professionnelle.
            </p>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-heading leading-none tracking-[-0.04em]"
                    style={{ fontSize: 'clamp(52px, 6vw, 72px)', color: 'var(--text-accent)', fontWeight: 400 }}>
                100%
              </span>
            </div>
            <p className="text-[16px] font-semibold" style={{ color: 'var(--text-strong)' }}>
              De votre formation peut être prise en charge
            </p>
          </div>
          <div className="reveal-up flex flex-col" style={{ borderTop: '1px solid var(--border-default)' }}>
            {FINANCEMENTS.map((f) => (
              <div key={f.title} className="flex items-center gap-5 py-6"
                   style={{ borderBottom: '1px solid var(--border-default)' }}>
                <span className="text-[11px] font-bold w-8 shrink-0 tracking-[0.04em]"
                      style={{ color: 'var(--text-muted)' }}>{f.n}</span>
                <div className="flex-1">
                  <p className="text-[15px] font-semibold" style={{ color: 'var(--text-strong)' }}>{f.title}</p>
                  <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{f.detail}</p>
                </div>
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full shrink-0"
                     style={{ background: 'var(--surface-accent)', border: '1px solid var(--mia-purple-soft)' }}>
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--text-accent)' }} />
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--text-accent)' }}>Disponible</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TÉMOIGNAGES ═══════════════════════════════════════════════════════ */}
      <section id="temoignages" className="relative py-28">
        <div className="mx-auto max-w-[1200px] px-8">
          <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
            <div>
              <SectionLabel>Témoignages</SectionLabel>
              <h2 className="font-heading leading-[1.1] tracking-[-0.025em]"
                  style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', color: 'var(--text-strong)', fontWeight: 400 }}>
                Ce que disent<br />nos étudiants
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" style={{ color: 'var(--text-accent)' }} />
              ))}
              <span className="ml-2 text-[14px] font-semibold" style={{ color: 'var(--text-strong)' }}>4.9 / 5</span>
              <span className="ml-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>· 200+ avis</span>
            </div>
          </div>
          <div className="reveal-up">
            <TestimonialBlock />
          </div>
        </div>
      </section>

      {/* ══ CTA — rounded dark container ══════════════════════════════════════ */}
      <section id="cta" className="py-12 sm:py-20 px-4 sm:px-8">
        <div id="cta-inner"
             className="mx-auto max-w-[1200px] rounded-[28px] p-16 grid items-center gap-10"
             style={{ background: 'var(--mia-near-black)', gridTemplateColumns: '1.3fr 0.7fr' }}>
          <div>
            <div className="mb-6">
              <Image src={logoLightSrc} alt="MIA Digital" width={60} height={60} className="object-contain" />
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] mb-4"
                 style={{ color: 'var(--text-accent)' }}>
              Prêt à commencer ?
            </div>
            <h2 className="font-heading leading-[1.1] tracking-[-0.02em] mb-5"
                style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: '#fff', fontWeight: 400 }}>
              Rejoignez MIA Digital<br />dès aujourd&apos;hui
            </h2>
            <p className="text-[16px] leading-[1.7]" style={{ color: 'var(--mia-slate)' }}>
              Accédez à votre espace pour consulter vos formations et démarrer votre
              parcours vers la certification.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/login"
                  className="inline-flex items-center justify-center gap-2 font-semibold text-[14px] px-6 py-3 rounded-[32px] text-white transition-all hover:-translate-y-px"
                  style={{ background: 'var(--mia-purple)' }}>
              Se connecter <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register"
                  className="inline-flex items-center justify-center gap-2 font-semibold text-[14px] px-6 py-3 rounded-[32px] transition-all hover:-translate-y-px"
                  style={{ border: '1.5px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
              Créer un compte étudiant
            </Link>
          </div>
        </div>
      </section>

      {/* ══ CONTACT ═══════════════════════════════════════════════════════════ */}
      <section id="contact" className="relative py-28" style={{ background: 'var(--surface-muted)' }}>
        <div className="info-two-col mx-auto max-w-[1200px] px-8 grid items-start gap-20"
             style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="reveal-up">
            <SectionLabel>Contact</SectionLabel>
            <h2 className="font-heading leading-[1.05] tracking-[-0.02em] mb-5"
                style={{ fontSize: 'clamp(22px, 2.5vw, 32px)', color: 'var(--text-strong)', fontWeight: 400 }}>
              Parlons de votre<br />projet de formation
            </h2>
            <p className="text-[15px] leading-[1.82] mb-8" style={{ color: 'var(--text-muted)' }}>
              Notre équipe pédagogique est disponible pour répondre à toutes vos questions
              et vous orienter vers la formation la plus adaptée à votre profil.
            </p>
            <div className="flex flex-col gap-4 mb-8">
              {[
                { Icon: MapPin, text: '45 Avenue de la Formation, Casablanca 20250, Maroc' },
                { Icon: Phone,  text: '+212 522 456 789'        },
                { Icon: Mail,   text: 'contact@miaformation.ma' },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-start gap-3.5 text-[14px]"
                     style={{ color: 'var(--text-muted)' }}>
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                       style={{ background: 'var(--surface-accent)', border: '1px solid var(--mia-purple-soft)' }}>
                    <Icon className="w-4 h-4" style={{ color: 'var(--text-accent)' }} />
                  </div>
                  {text}
                </div>
              ))}
            </div>
            <Link href="/planifier"
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-[32px] text-white text-[14px] font-semibold transition-all hover:-translate-y-px"
                  style={{ background: 'var(--mia-near-black)' }}>
              Planifier un échange <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="reveal-up">
            <SectionLabel>Horaires</SectionLabel>
            <h2 className="font-heading leading-[1.05] tracking-[-0.02em] mb-6"
                style={{ fontSize: 'clamp(22px, 2.5vw, 32px)', color: 'var(--text-strong)', fontWeight: 400 }}>
              Horaires d&apos;ouverture
            </h2>
            <div className="rounded-[16px] overflow-hidden"
                 style={{ border: '1px solid var(--border-default)' }}>
              {[
                { day: 'Lun – Ven', hours: '08h30 – 19h00', closed: false },
                { day: 'Samedi',    hours: '09h00 – 13h00', closed: false },
                { day: 'Dimanche',  hours: 'Fermé',          closed: true  },
              ].map(({ day, hours, closed }, i, arr) => (
                <div key={day} className="flex items-center justify-between px-6 py-4"
                     style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-default)' : 'none' }}>
                  <div className="flex items-center gap-3 text-[14px] font-semibold"
                       style={{ color: 'var(--text-strong)' }}>
                    <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    {day}
                  </div>
                  <span className="text-[14px] font-medium"
                        style={{ color: closed ? 'var(--mia-coral)' : 'var(--text-muted)' }}>
                    {hours}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER — 4-col dark ════════════════════════════════════════════════ */}
      <footer id="footer" style={{ background: 'var(--mia-near-black)', color: '#fff' }}>
        <div className="mx-auto max-w-[1200px] px-8 pt-16 pb-10">
          <div className="footer-grid grid gap-10 mb-14"
               style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1.4fr' }}>
            {/* Brand */}
            <div className="footer-brand">
              <div className="mb-4">
                <Image src={logoLightSrc} alt="MIA Digital" width={60} height={60} className="object-contain" />
              </div>
              <p className="text-[14px] leading-[1.6] max-w-[200px]" style={{ color: 'var(--mia-slate)' }}>
                Centre de formation professionnelle certifié. Building skills. Shaping futures.
              </p>
            </div>

            {/* Link columns */}
            {[
              { heading: 'Formations', links: ['Développement Web', 'Data Science & IA', 'Business & Management', 'Design UX/UI'] },
              { heading: 'MIA',        links: ['Qui sommes-nous', 'Certifications', 'Financements', 'Témoignages'] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <p className="text-[11px] font-bold tracking-[0.1em] uppercase mb-5"
                   style={{ color: 'var(--mia-slate)' }}>{heading}</p>
                <div className="flex flex-col gap-3">
                  {links.map(link => (
                    <a key={link} href="#"
                       className="text-[14px] transition-colors"
                       style={{ color: 'rgba(255,255,255,0.45)' }}
                       onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                       onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'}>
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}

            {/* Newsletter */}
            <div>
              <p className="text-[11px] font-bold tracking-[0.1em] uppercase mb-5"
                 style={{ color: 'var(--mia-slate)' }}>Newsletter</p>
              <p className="text-[14px] mb-4" style={{ color: 'var(--mia-slate)' }}>
                Actualités mensuelles sur les compétences.
              </p>
              <div className="footer-newsletter-row flex gap-2">
                <input
                  placeholder="Email"
                  className="flex-1 rounded-[8px] px-3 py-2.5 text-[14px] outline-none"
                  style={{ background: '#22222A', border: '1px solid #33333D', color: '#fff' }}
                />
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-[32px] font-semibold text-[13px] text-white transition-all hover:-translate-y-px"
                  style={{ background: 'var(--mia-purple)' }}>
                  S&apos;abonner
                </button>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between pt-6 flex-wrap gap-4"
               style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              © {new Date().getFullYear()} MIA Digital. Tous droits réservés.
            </span>
            <div className="flex gap-5">
              {['Confidentialité', 'Conditions'].map(item => (
                <a key={item} href="#"
                   className="text-[12px] transition-colors"
                   style={{ color: 'rgba(255,255,255,0.25)' }}
                   onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'}
                   onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)'}>
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
} // end LandingPage
