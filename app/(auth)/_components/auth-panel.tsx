import './auth.css'
import { Check } from 'lucide-react'
import Image from 'next/image'
import logoLightSrc from '@/public/logo-light.png'

const features = [
  'Accédez à vos formations certifiantes',
  'Suivez votre progression et vos résultats',
  'Consultez votre planning et réservez vos séances',
  'Téléchargez vos attestations et certificats',
]

export default function AuthPanel() {
  return (
    <div className="auth-panel hidden lg:flex lg:flex-col relative w-full h-full overflow-hidden">
      <div className="auth-panel-glow-top" />
      <div className="auth-panel-glow-bottom" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-12 py-16 gap-10">

        {/* Logo */}
        <Image src={logoLightSrc} alt="MIA Académie" width={44} height={44} className="object-contain" />

        {/* Headline */}
        <div className="flex flex-col gap-4">
          <h2 className="auth-panel-heading font-heading text-4xl text-white leading-tight tracking-tight">
            Développez vos compétences.<br />Façonnez votre avenir.
          </h2>
          <p className="text-white/70 text-base leading-relaxed max-w-xs">
            MIA Académie accompagne les professionnels dans leur montée en compétences grâce à des programmes certifiés et des formateurs experts du terrain.
          </p>
        </div>

        {/* Feature bullets */}
        <ul className="flex flex-col gap-3">
          {features.map(f => (
            <li key={f} className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </span>
              <span className="text-white/80 text-sm">{f}</span>
            </li>
          ))}
        </ul>

        {/* Testimonial */}
        <div className="bg-white/10 border border-white/15 rounded-2xl p-5">
          <p className="text-white/90 text-sm leading-relaxed">
            &ldquo;MIA Académie a transformé mon parcours. En 6 mois j&apos;ai acquis les compétences pour décrocher mon premier emploi de développeuse.&rdquo;
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-xs shrink-0">
              YB
            </div>
            <div>
              <p className="text-white text-sm font-medium">Yasmine B.</p>
              <p className="text-white/50 text-xs">Développeuse Web · Promo 2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
