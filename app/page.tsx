import Image from 'next/image'
import logoLightSrc from '@/public/logo-light.png'
import { Mail } from 'lucide-react'
import './coming-soon.css'

export default function ComingSoonPage() {
  return (
    <div className="cs-root relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-6 text-center">
      {/* Purple radial glow — top center */}
      <div className="cs-glow-top absolute pointer-events-none" />

      {/* Warm glow — bottom right */}
      <div className="cs-glow-bottom absolute pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-160 w-full">

        {/* Logo */}
        <div className="mb-12">
          <Image
            src={logoLightSrc}
            alt="MIA Académie"
            width={72}
            height={72}
            className="object-contain"
            priority
          />
        </div>

        {/* Badge */}
        <div className="cs-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8">
          <span className="cs-badge-pill px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white">
            BIENTÔT
          </span>
          <span className="cs-badge-text text-[13px] pr-1">
            La plateforme est en cours de finalisation
          </span>
        </div>

        {/* Headline */}
        <h1 className="cs-headline font-heading mb-6">
          Quelque chose{' '}
          <span className="cs-headline-accent">de grand</span>
          <br />
          arrive bientôt.
        </h1>

        {/* Subtitle */}
        <p className="cs-subtitle text-[16px] leading-[1.8] mb-10 max-w-115">
          MIA Académie finalise sa plateforme de formation professionnelle.
          Des programmes certifiés, des formateurs experts — disponibles très prochainement.
        </p>

        {/* Divider */}
        <div className="flex items-center gap-4 w-full max-w-60 mb-10">
          <div className="cs-divider-line flex-1 h-px" />
          <span className="cs-divider-dot">●</span>
          <div className="cs-divider-line flex-1 h-px" />
        </div>

        {/* Contact */}
        <a
          href="mailto:contact@mia-academie.com"
          className="cs-contact-btn inline-flex items-center gap-2.5 px-5 py-3 rounded-full text-[14px] font-semibold transition-all hover:-translate-y-px"
        >
          <Mail className="cs-contact-icon w-4 h-4" />
          contact@mia-academie.com
        </a>
      </div>

      {/* Footer note */}
      <p className="cs-footer-note absolute bottom-8 text-[12px]">
        © {new Date().getFullYear()} MIA Académie. Tous droits réservés.
      </p>
    </div>
  )
}
