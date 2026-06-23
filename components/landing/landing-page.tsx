'use client'

import './landing.css'
import { useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import logoSrc from '@/public/logo.png'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import {
  ArrowRight, MapPin, Phone, Mail, Clock, Star,
  ChevronLeft, ChevronRight, CheckCircle2,
  Code2, Brain, TrendingUp, Layers, BookOpen,
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export interface LandingCategory {
  name: string
  description: string
  count: number
}

// ─── Brand ────────────────────────────────────────────────────────────────────
const MV      = '#8B28E0'
const MV_L    = '#C080F0'   // light purple — for dark backgrounds
const MV_BG   = '#F8F0FF'   // very light purple — for white backgrounds
const MV_BDR  = '#E0C0FF'   // light purple border
const MV_GRAD = 'linear-gradient(135deg, #9B30EF 0%, #6C18C0 100%)'

// Section backgrounds
const BG_DARK  = '#060A14'  // nav, hero, CTA band, footer
const BG_WHITE = '#FFFFFF'  // all content sections

// Text for white sections
const INK   = '#111827'
const INK_2 = '#6B7280'
const INK_3 = '#9CA3AF'
const LINE  = '#E5E7EB'

// ─── Static content ───────────────────────────────────────────────────────────
const STATS = [
  { n: '850+',  label: 'Étudiants formés'    },
  { n: '94 %',  label: "Taux d'insertion"    },
  { n: '28+',   label: 'Formateurs certifiés' },
  { n: '4.9/5', label: 'Satisfaction moyenne' },
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
    quote: "MIA Formation a transformé mon parcours. En 6 mois j'ai acquis les compétences pour décrocher mon premier emploi de développeuse. Les formateurs sont disponibles et les projets vraiment concrets.",
  },
  {
    name: 'Karim L.', role: 'Data Analyst · Promo 2024', stars: 5,
    quote: "Formation de très haute qualité. L'approche pratique et les certifications reconnues m'ont permis de trouver un poste chez une scale-up parisienne 2 mois après l'obtention de mon diplôme.",
  },
  {
    name: 'Sara M.', role: 'UX Designer · Promo 2025', stars: 5,
    quote: "La plateforme est intuitive, les formateurs experts et le suivi post-formation exceptionnel. Je recommande MIA à tous ceux qui veulent se reconvertir dans le digital.",
  },
]

const FALLBACK_CATS: LandingCategory[] = [
  { name: 'Développement Web & Mobile', description: 'React, Node.js, TypeScript — développeur fullstack en 6 mois.', count: 4 },
  { name: 'Data Science & IA',          description: 'Python, Machine Learning, Deep Learning.',                        count: 3 },
  { name: 'Business & Management',      description: 'Gestion de projet, marketing digital, leadership.',               count: 3 },
  { name: 'Design UX/UI',               description: 'Figma, design systems, prototypage produit.',                     count: 2 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
type LucideIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>

function catIcon(name: string): LucideIcon {
  const n = name.toLowerCase()
  if (n.includes('web') || n.includes('développ') || n.includes('mobile')) return Code2
  if (n.includes('data') || n.includes('ia') || n.includes('intelligence')) return Brain
  if (n.includes('business') || n.includes('management') || n.includes('marketing')) return TrendingUp
  if (n.includes('design') || n.includes('ux') || n.includes('ui')) return Layers
  return BookOpen
}

// SectionLabel — variant='dark' for hero/CTA, default for white sections
function SectionLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  const color = dark ? MV_L : MV
  return (
    <p className="inline-flex items-center gap-2.5 text-[11px] font-bold tracking-[0.1em] uppercase mb-4"
       style={{ color }}>
      <span className="w-5 h-[1.5px] rounded-sm inline-block" style={{ background: color }} />
      {children}
    </p>
  )
}

// ─── Testimonial carousel ─────────────────────────────────────────────────────
function TestimonialBlock() {
  const [idx, setIdx] = useState(0)
  const t = TESTIMONIALS[idx]
  return (
    <div className="grid items-start gap-14" style={{ gridTemplateColumns: '1fr 280px' }}>
      {/* Quote */}
      <div>
        <div className="flex gap-1 mb-8">
          {Array.from({ length: t.stars }).map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-current" style={{ color: MV }} />
          ))}
        </div>
        <blockquote
          className="font-black tracking-[-0.03em] leading-[1.35] mb-10"
          style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', color: INK }}
        >
          &ldquo;{t.quote}&rdquo;
        </blockquote>
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-black text-white shrink-0"
               style={{ background: MV_GRAD }}>
            {t.name[0]}
          </div>
          <div>
            <p className="font-black text-[14px]" style={{ color: INK }}>{t.name}</p>
            <p className="text-[13px]" style={{ color: INK_3 }}>{t.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <div className="flex flex-col justify-between h-full min-h-[200px] pl-10"
           style={{ borderLeft: `1px solid ${LINE}` }}>
        <div className="flex flex-col">
          {TESTIMONIALS.map((ti, i) => (
            <button key={ti.name} type="button" onClick={() => setIdx(i)}
                    className="text-left py-4 transition-colors"
                    style={{ borderBottom: `1px solid ${LINE}` }}>
              <p className="text-[14px] font-bold transition-colors"
                 style={{ color: i === idx ? MV : INK_3 }}>
                {ti.name}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: INK_3 }}>
                {ti.role.split('·')[1]?.trim()}
              </p>
            </button>
          ))}
        </div>
        <div className="flex gap-2 pt-4">
          <button type="button" aria-label="Précédent"
                  onClick={() => setIdx((idx - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                  style={{ border: `1px solid ${LINE}` }}>
            <ChevronLeft className="w-4 h-4" style={{ color: INK_2 }} />
          </button>
          <button type="button" aria-label="Suivant"
                  onClick={() => setIdx((idx + 1) % TESTIMONIALS.length)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                  style={{ border: `1px solid ${LINE}` }}>
            <ChevronRight className="w-4 h-4" style={{ color: INK_2 }} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingPage({ categories }: { categories: LandingCategory[] }) {
  const rafRef = useRef<((time: number) => void) | null>(null)
  const cats   = categories.length > 0 ? categories : FALLBACK_CATS

  useLayoutEffect(() => {
    const lenis = new Lenis({ autoRaf: false, lerp: 0.1 })
    const rafFn = (time: number) => lenis.raf(time * 1000)
    rafRef.current = rafFn
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(rafFn)
    gsap.ticker.lagSmoothing(0)

    // Entry curtain
    const entry = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.7 } })
    entry
      .to('#page-wipe',       { scaleX: 0, duration: 1.1, ease: 'expo.inOut', transformOrigin: 'right' })
      .set('#page-wipe',      { display: 'none' })
      .from('#site-nav',      { y: -64, opacity: 0, duration: 0.5 }, '-=0.1')
      .from('#hero-tag',      { y: 18,  opacity: 0, duration: 0.5 }, '-=0.15')
      .from('.hero-word',     { y: 72,  opacity: 0, stagger: 0.08, duration: 0.8 }, '-=0.3')
      .from('#hero-sub',      { y: 22,  opacity: 0, duration: 0.55 }, '<0.2')
      .from('#hero-ctas > *', { y: 14,  opacity: 0, stagger: 0.1,  duration: 0.45 }, '<0.2')
      .from('#hero-stats',    { y: 30,  opacity: 0, duration: 0.6  }, '<0.15')
      .from('.hero-glow',     { opacity: 0, scale: 0.7, duration: 1.4, ease: 'power2.out' }, 0.2)

    // Formation cards
    ScrollTrigger.batch('.f-card', {
      start: 'top 88%', once: true, interval: 0.08,
      onEnter: (els) => gsap.from(els, { opacity: 0, y: 40, stagger: 0.08, duration: 0.7, ease: 'power3.out' }),
    })

    // Pillar rows
    document.querySelectorAll<HTMLElement>('.pillar-row').forEach((el, i) => {
      gsap.from(el, {
        opacity: 0, y: 40, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 82%', once: true, refreshPriority: -i },
      })
    })

    // KPI counters
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

    // Generic reveal
    document.querySelectorAll<HTMLElement>('.reveal-up').forEach((el, i) => {
      gsap.from(el, {
        opacity: 0, y: 40, duration: 0.75, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 84%', once: true, refreshPriority: -i },
      })
    })

    // CTA reveal
    gsap.from('#cta-inner', {
      opacity: 0, y: 56, scale: 0.97, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '#cta', start: 'top 78%', once: true },
    })

    // Nav: transparent over hero, white+dark when over white sections
    const nav = document.getElementById('site-nav')

    function setNavLight(light: boolean) {
      if (!nav) return
      if (light) {
        nav.classList.add('nav--light')
        // update link colours
        nav.querySelectorAll<HTMLElement>('.nav-link').forEach(el => {
          el.style.color = 'rgba(55,65,81,0.75)'
        })
      } else {
        nav.classList.remove('nav--light')
        nav.style.backgroundColor   = 'transparent'
        nav.style.borderBottomColor = 'transparent'
        nav.querySelectorAll<HTMLElement>('.nav-link').forEach(el => {
          el.style.color = 'rgba(255,255,255,0.55)'
        })
      }
    }

    // Enter white sections
    ScrollTrigger.create({
      trigger: '#formations',
      start: 'top top',
      onEnter:     () => setNavLight(true),
      onLeaveBack: () => setNavLight(false),
    })

    // Return to dark (CTA band)
    ScrollTrigger.create({
      trigger: '#cta',
      start: 'top top',
      onEnter:     () => setNavLight(false),
      onLeaveBack: () => setNavLight(true),
    })

    return () => {
      if (rafRef.current) gsap.ticker.remove(rafRef.current)
      lenis.destroy()
      ScrollTrigger.getAll().forEach(st => st.kill())
    }
  }, [])

  return (
    <div className="relative overflow-x-hidden" style={{ background: BG_DARK, color: INK }}>
      <div id="page-wipe" />

      {/* ══ NAV (dark) ═══════════════════════════════════════════════════════ */}
      <nav id="site-nav" className="fixed top-0 left-0 right-0 z-50"
           style={{ borderBottom: '1px solid transparent' }}>
        <div className="landing-wrap mx-auto max-w-[1160px] px-10 py-5 flex items-center justify-between">

          <Link href="/" className="flex items-center">
            <div className="w-[44px] h-[44px] rounded-[10px] bg-white flex items-center justify-center shrink-0">
              <Image src={logoSrc} alt="MIA Formation" width={36} height={36} className="object-contain" priority />
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-0.5">
            {[
              ['#formations',   'Formations'   ],
              ['#pourquoi',     'Pourquoi MIA' ],
              ['#financements', 'Financements' ],
              ['#temoignages',  'Témoignages'  ],
              ['#contact',      'Contact'      ],
            ].map(([href, label]) => (
              <a key={href} href={href}
                 className="nav-link px-4 py-2 rounded-lg text-[13.5px] font-medium"
                 style={{ color: 'rgba(255,255,255,0.55)', transition: 'color 0.2s ease' }}
                 onMouseEnter={e => {
                   const light = document.getElementById('site-nav')?.classList.contains('nav--light')
                   e.currentTarget.style.color = light ? '#111827' : '#FFFFFF'
                 }}
                 onMouseLeave={e => {
                   const light = document.getElementById('site-nav')?.classList.contains('nav--light')
                   e.currentTarget.style.color = light ? 'rgba(55,65,81,0.75)' : 'rgba(255,255,255,0.55)'
                 }}>
                {label}
              </a>
            ))}
          </div>

          <Link href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[9px] text-white text-[13px] font-bold hover:-translate-y-0.5 transition-all"
                style={{ background: MV_GRAD, boxShadow: '0 4px 20px rgba(139,40,224,0.35)' }}>
            Mon espace <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ══ HERO (dark + glow orb) ════════════════════════════════════════════ */}
      <section id="hero"
               className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden"
               style={{ paddingTop: 88 }}>
        <div className="hero-glow" />
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
             style={{ background: `linear-gradient(to bottom, transparent, ${BG_DARK})` }} />

        <div className="landing-wrap relative z-10 mx-auto max-w-[1160px] px-10 py-32">
          {/* Badge */}
          <div id="hero-tag"
               className="inline-flex items-center gap-2.5 px-4 py-2 mb-10 rounded-full"
               style={{ background: 'rgba(139,40,224,0.15)', border: '1px solid rgba(139,40,224,0.3)' }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: MV_L }} />
            <span className="text-[11.5px] font-bold tracking-[0.09em] uppercase" style={{ color: MV_L }}>
              Centre de formation certifié Qualiopi
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-black leading-[1.06] tracking-[-0.045em] text-white mb-8 max-w-[820px] mx-auto"
              style={{ fontSize: 'clamp(42px, 6.5vw, 78px)' }}>
            <span className="hero-word-wrap"><span className="hero-word">Devenez&nbsp;</span></span>
            <span className="hero-word-wrap">
              <span className="hero-word" style={{ color: MV_L }}>expert&nbsp;</span>
            </span>
            <span className="hero-word-wrap"><span className="hero-word">dans&nbsp;</span></span>
            <br />
            <span className="hero-word-wrap"><span className="hero-word">votre&nbsp;</span></span>
            <span className="hero-word-wrap"><span className="hero-word">domaine</span></span>
          </h1>

          <p id="hero-sub" className="max-w-[540px] mx-auto text-[17px] leading-[1.78] mb-12"
             style={{ color: 'rgba(255,255,255,0.55)' }}>
            MIA Formation vous accompagne dans votre montée en compétences grâce à des
            programmes certifiés et des formateurs experts du terrain.
          </p>

          <div id="hero-ctas" className="flex items-center justify-center gap-4 flex-wrap mb-20">
            <Link href="/register"
                  className="inline-flex items-center gap-2.5 px-7 py-[15px] rounded-[11px] text-white text-[14.5px] font-bold hover:-translate-y-0.5 transition-all"
                  style={{ background: MV_GRAD, boxShadow: '0 6px 28px rgba(139,40,224,0.45)' }}>
              Réserver ma formation <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#contact"
               className="inline-flex items-center gap-2 px-7 py-[15px] rounded-[11px] text-white text-[14.5px] font-bold hover:-translate-y-0.5 transition-all"
               style={{ border: '1.5px solid rgba(255,255,255,0.14)' }}>
              Planifier un échange découverte
            </a>
          </div>

          <div id="hero-stats" className="stat-row max-w-[680px] mx-auto">
            {STATS.map(({ n, label }) => (
              <div key={label} className="stat-cell">
                <div className="font-black text-[26px] tracking-[-0.04em] text-white mb-0.5">{n}</div>
                <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FORMATIONS (white) ════════════════════════════════════════════════ */}
      <section id="formations" className="relative py-28 hidden"
               style={{ background: BG_WHITE }}>
        <div className="landing-wrap mx-auto max-w-[1160px] px-10">
          <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
            <div>
              <SectionLabel>Catalogue</SectionLabel>
              <h2 className="font-black tracking-[-0.04em] leading-[1.1]"
                  style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', color: INK }}>
                Nos domaines<br />de formation
              </h2>
            </div>
            <Link href="/courses"
                  className="inline-flex items-center gap-1.5 text-[14px] font-bold transition-all hover:gap-3"
                  style={{ color: MV }}>
              Toutes les formations <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {cats.slice(0, 4).map((cat) => {
              const Icon = catIcon(cat.name)
              return (
                <Link key={cat.name} href="/courses" className="f-card light-card block">
                  <div className="card-thumb-light">
                    <Icon className="w-9 h-9" style={{ color: MV }} />
                  </div>
                  <div className="p-5">
                    <p className="text-[16px] font-black mb-1.5 tracking-[-0.02em]"
                       style={{ color: INK }}>{cat.name}</p>
                    <p className="text-[13px] leading-[1.65] mb-4" style={{ color: INK_2 }}>
                      {cat.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold px-3 py-1 rounded-full"
                            style={{ background: MV_BG, color: MV, border: `1px solid ${MV_BDR}` }}>
                        {cat.count} formation{cat.count !== 1 ? 's' : ''}
                      </span>
                      <ArrowRight className="w-4 h-4" style={{ color: INK_3 }} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ À PROPOS (white) ══════════════════════════════════════════════════ */}
      <section id="about" className="relative py-28"
               style={{ background: BG_WHITE }}>
        <div className="landing-wrap info-two-col mx-auto max-w-[1160px] px-10 grid gap-20 items-start"
             style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="reveal-up">
            <SectionLabel>Qui sommes-nous ?</SectionLabel>
            <h2 className="font-black tracking-[-0.04em] leading-[1.1] mb-6"
                style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', color: INK }}>
              MIA Formation,<br />l&apos;académie qui<br />transforme les talents
            </h2>
            <p className="text-[15px] leading-[1.82] mb-5" style={{ color: INK_2 }}>
              MIA Formation est un centre de formation professionnelle certifié Qualiopi.
              Nous croyons que chaque apprenant mérite une formation de qualité, accessible
              et directement opérationnelle.
            </p>
            <p className="text-[15px] leading-[1.82]" style={{ color: INK_2 }}>
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
                <div className="font-black leading-none mb-2 tracking-[-0.05em]"
                     style={{ fontSize: 'clamp(34px, 4vw, 48px)', color: MV }}>
                  {n}
                </div>
                <p className="text-[13px] font-medium" style={{ color: INK_3 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ POURQUOI MIA (white) ══════════════════════════════════════════════ */}
      <section id="pourquoi" className="relative py-28"
               style={{ background: BG_WHITE }}>
        <div className="landing-wrap mx-auto max-w-[1160px] px-10">
          <SectionLabel>Pourquoi nous choisir ?</SectionLabel>
          <h2 className="font-black tracking-[-0.04em] leading-[1.1] mb-16 max-w-[580px]"
              style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', color: INK }}>
            La seule académie avec double expertise Conseil &amp; Formation
          </h2>

          {PILLARS.map((p, pidx) => (
            <div key={p.n} className="pillar-row grid items-start py-14"
                 style={{
                   gridTemplateColumns: '110px 1fr 340px',
                   borderTop:    pidx === 0 ? `1px solid ${LINE}` : undefined,
                   borderBottom: `1px solid ${LINE}`,
                 }}>
              <div className="ghost-n">{p.n}</div>
              <div className="pr-12">
                <p className="text-[19px] font-black tracking-[-0.03em] mb-3"
                   style={{ color: INK }}>{p.title}</p>
                <p className="text-[14px] leading-[1.82]" style={{ color: INK_2 }}>{p.desc}</p>
              </div>
              <div className="pillar-kpis grid grid-cols-2 gap-5 pl-10"
                   style={{ borderLeft: `1px solid ${LINE}` }}>
                {p.kpis.map((k) => (
                  <div key={k.label}>
                    <div className="font-black tracking-[-0.05em] leading-none mb-1.5"
                         style={{ fontSize: 'clamp(26px, 3vw, 36px)', color: INK }}>
                      <span className="kpi-val" data-end={k.end}>0</span>
                      <span style={{ color: MV }}>{k.suffix}</span>
                    </div>
                    <div className="text-[12px] leading-[1.5]" style={{ color: INK_3 }}>{k.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CERTIFICATIONS (white) ════════════════════════════════════════════ */}
      <section id="certifications" className="relative py-28"
               style={{ background: BG_WHITE }}>
        <div className="landing-wrap info-two-col mx-auto max-w-[1160px] px-10 grid gap-20 items-center"
             style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="reveal-up">
            <SectionLabel>Nos certifications</SectionLabel>
            <h2 className="font-black tracking-[-0.04em] leading-[1.1] mb-5"
                style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', color: INK }}>
              Certifications reconnues par les professionnels
            </h2>
            <p className="text-[15px] leading-[1.75]" style={{ color: INK_2 }}>
              Nos formations débouchent sur des certifications officiellement reconnues,
              éligibles au CPF et valorisées sur le marché national et international.
            </p>
          </div>
          <div className="reveal-up flex flex-wrap gap-3">
            {CERTS.map(c => (
              <div key={c}
                   className="flex items-center gap-2.5 px-5 py-3 rounded-full"
                   style={{ background: MV_BG, border: `1px solid ${MV_BDR}` }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: MV }} />
                <span className="text-[14px] font-bold" style={{ color: INK }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINANCEMENTS (white) ══════════════════════════════════════════════ */}
      <section id="financements" className="relative py-28"
               style={{ background: BG_WHITE }}>
        <div className="landing-wrap info-two-col mx-auto max-w-[1160px] px-10 grid gap-20 items-start"
             style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="reveal-up">
            <SectionLabel>Nos financements</SectionLabel>
            <h2 className="font-black tracking-[-0.04em] leading-[1.1] mb-5"
                style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', color: INK }}>
              Votre formation,<br />sans obstacle financier
            </h2>
            <p className="text-[15px] leading-[1.75] mb-10" style={{ color: INK_2 }}>
              Plusieurs dispositifs sont disponibles pour rendre votre formation accessible
              quelle que soit votre situation professionnelle.
            </p>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-black leading-none tracking-[-0.05em]"
                    style={{ fontSize: 'clamp(52px, 6vw, 72px)', color: MV }}>
                100%
              </span>
            </div>
            <p className="text-[16px] font-bold" style={{ color: INK }}>
              De votre formation peut être prise en charge
            </p>
          </div>

          <div className="reveal-up flex flex-col" style={{ borderTop: `1px solid ${LINE}` }}>
            {FINANCEMENTS.map((f) => (
              <div key={f.title} className="flex items-center gap-5 py-6"
                   style={{ borderBottom: `1px solid ${LINE}` }}>
                <span className="text-[11px] font-black w-8 shrink-0 tracking-[0.04em]"
                      style={{ color: INK_3 }}>{f.n}</span>
                <div className="flex-1">
                  <p className="text-[15px] font-black" style={{ color: INK }}>{f.title}</p>
                  <p className="text-[13px] mt-0.5" style={{ color: INK_2 }}>{f.detail}</p>
                </div>
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full shrink-0"
                     style={{ background: MV_BG, border: `1px solid ${MV_BDR}` }}>
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: MV }} />
                  <span className="text-[12px] font-bold" style={{ color: MV }}>Disponible</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TÉMOIGNAGES (white) ═══════════════════════════════════════════════ */}
      <section id="temoignages" className="relative py-28"
               style={{ background: BG_WHITE }}>
        <div className="landing-wrap mx-auto max-w-[1160px] px-10">
          <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
            <div>
              <SectionLabel>Témoignages</SectionLabel>
              <h2 className="font-black tracking-[-0.04em] leading-[1.1]"
                  style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', color: INK }}>
                Ce que disent<br />nos étudiants
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" style={{ color: MV }} />
              ))}
              <span className="ml-2 text-[14px] font-bold" style={{ color: INK }}>4.9 / 5</span>
              <span className="ml-1 text-[13px]" style={{ color: INK_3 }}>· 200+ avis</span>
            </div>
          </div>
          <div className="reveal-up">
            <TestimonialBlock />
          </div>
        </div>
      </section>

      {/* ══ CONTACT (white) ═══════════════════════════════════════════════════ */}
      <section id="contact" className="relative py-28"
               style={{ background: BG_WHITE }}>
        <div className="landing-wrap info-two-col mx-auto max-w-[1160px] px-10 grid items-start gap-20"
             style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="reveal-up">
            <SectionLabel>Contact</SectionLabel>
            <h2 className="font-black tracking-[-0.03em] mb-5"
                style={{ fontSize: 'clamp(22px, 2.5vw, 32px)', color: INK }}>
              Parlons de votre<br />projet de formation
            </h2>
            <p className="text-[15px] leading-[1.82] mb-8" style={{ color: INK_2 }}>
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
                     style={{ color: INK_2 }}>
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                       style={{ background: MV_BG, border: `1px solid ${MV_BDR}` }}>
                    <Icon className="w-4 h-4" style={{ color: MV }} />
                  </div>
                  {text}
                </div>
              ))}
            </div>
            <Link href="/register"
                  className="inline-flex items-center gap-2.5 px-6 py-[13px] rounded-[10px] text-white text-[14px] font-bold hover:-translate-y-0.5 transition-all"
                  style={{ background: MV_GRAD, boxShadow: '0 4px 20px rgba(139,40,224,0.25)' }}>
              Commencer ma formation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="reveal-up">
            <SectionLabel>Horaires</SectionLabel>
            <h2 className="font-black tracking-[-0.03em] mb-6"
                style={{ fontSize: 'clamp(22px, 2.5vw, 32px)', color: INK }}>
              Horaires d&apos;ouverture
            </h2>
            <div className="rounded-[16px] overflow-hidden"
                 style={{ border: `1px solid ${LINE}` }}>
              {[
                { day: 'Lun – Ven', hours: '08h30 – 19h00', closed: false },
                { day: 'Samedi',    hours: '09h00 – 13h00', closed: false },
                { day: 'Dimanche',  hours: 'Fermé',          closed: true  },
              ].map(({ day, hours, closed }, i, arr) => (
                <div key={day} className="flex items-center justify-between px-6 py-4"
                     style={{ borderBottom: i < arr.length - 1 ? `1px solid ${LINE}` : 'none' }}>
                  <div className="flex items-center gap-3 text-[14px] font-semibold"
                       style={{ color: INK }}>
                    <Clock className="w-4 h-4" style={{ color: INK_3 }} />
                    {day}
                  </div>
                  <span className="text-[14px] font-medium"
                        style={{ color: closed ? '#ef4444' : INK_2 }}>
                    {hours}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA BAND (dark) ═══════════════════════════════════════════════════ */}
      <section id="cta" className="relative py-32 text-center overflow-hidden"
               style={{ background: BG_DARK }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(139,40,224,0.28) 0%, transparent 65%)', filter: 'blur(20px)' }} />

        <div id="cta-inner" className="landing-wrap relative z-10 max-w-[600px] mx-auto px-10">
          <SectionLabel dark>Prêt à commencer ?</SectionLabel>
          <h2 className="font-black tracking-[-0.045em] leading-[1.07] text-white mb-5"
              style={{ fontSize: 'clamp(32px, 5vw, 58px)' }}>
            Rejoignez MIA Formation<br />dès aujourd&apos;hui
          </h2>
          <p className="text-[16px] leading-[1.75] mb-12" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Accédez à votre espace pour consulter vos formations, suivre votre progression
            et démarrer votre parcours vers la certification.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/login"
                  className="inline-flex items-center gap-2.5 px-7 py-[15px] rounded-[11px] text-white text-[14.5px] font-bold hover:-translate-y-0.5 transition-all"
                  style={{ background: MV_GRAD, boxShadow: '0 6px 28px rgba(139,40,224,0.45)' }}>
              Se connecter <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/register"
                  className="inline-flex items-center gap-2 px-7 py-[15px] rounded-[11px] text-[14.5px] font-bold hover:-translate-y-0.5 transition-all"
                  style={{ border: '1.5px solid rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.65)' }}>
              Créer un compte étudiant
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER (dark) ═════════════════════════════════════════════════════ */}
      <footer id="footer" className="pt-16 pb-8"
              style={{ background: BG_DARK }}>
        <div className="landing-wrap mx-auto max-w-[1160px] px-10">
          <div className="footer-grid grid gap-12 mb-14"
               style={{ gridTemplateColumns: '200px 1fr 1fr 1fr' }}>
            <div className="footer-brand flex flex-col gap-4">
              <div className="w-[44px] h-[44px] rounded-[10px] bg-white flex items-center justify-center shrink-0">
                <Image src={logoSrc} alt="MIA" width={36} height={36} className="object-contain" />
              </div>
              <p className="text-[13px] leading-[1.65]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                Centre de formation professionnelle certifié.
              </p>
            </div>
            {[
              { heading: 'Formations', links: ['Développement Web', 'Data Science & IA', 'Business & Management', 'Design UX/UI'] },
              { heading: 'MIA',        links: ['Qui sommes-nous', 'Certifications', 'Financements', 'Témoignages'] },
              { heading: 'Contact',    links: ['contact@miaformation.ma', '+212 522 456 789', 'Casablanca, Maroc'] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <p className="text-[11px] font-bold tracking-[0.1em] uppercase mb-5"
                   style={{ color: 'rgba(255,255,255,0.18)' }}>
                  {heading}
                </p>
                <div className="flex flex-col gap-3">
                  {links.map(link => (
                    <a key={link} href="#" className="text-[14px] transition-colors"
                       style={{ color: 'rgba(255,255,255,0.38)' }}
                       onMouseEnter={e => (e.currentTarget.style.color = MV_L)}
                       onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}>
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-7 flex-wrap gap-4"
               style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[12.5px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
              © {new Date().getFullYear()} MIA Formation. Tous droits réservés.
            </span>
            <Link href="/login"
                  className="px-5 py-2.5 rounded-[8px] text-white text-[13px] font-bold hover:-translate-y-0.5 transition-all"
                  style={{ background: MV_GRAD }}>
              Accéder à mon espace
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
