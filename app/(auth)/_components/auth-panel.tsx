import { Check } from 'lucide-react'

const features = [
  'Accédez aux formations permis (B, A, C, BE)',
  'Suivez votre progression et vos résultats',
  'Consultez votre planning et réservez vos séances',
  'Gérez vos documents et certificats',
]

export default function AuthPanel() {
  return (
    <div className="hidden lg:flex lg:flex-col relative w-full h-full overflow-hidden bg-[#1e2128]">
      {/* Subtle grain overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
      />
      {/* Blobs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-slate-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -left-24 w-80 h-80 bg-slate-700/20 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-12 py-16 gap-10">

        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0121 13c0 6.075-3.582 9-9 9s-9-2.925-9-9c0-.906.16-1.783.84-2.578L12 14z" />
          </svg>
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-4">
          <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
            Votre permis de conduire<br />en toute confiance
          </h2>
          <p className="text-white/70 text-base leading-relaxed max-w-xs">
            Rejoignez EduDrive, l&apos;auto-école moderne qui vous accompagne à chaque étape de votre formation permis.
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
            &ldquo;Grâce à EduDrive, j&apos;ai réussi mon permis au premier coup ! Les cours en ligne, le suivi avec mon moniteur et la gestion du planning tout en un seul endroit, c&apos;est vraiment efficace.&rdquo;
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-xs shrink-0">
              MK
            </div>
            <div>
              <p className="text-white text-sm font-medium">Mahdi Khoury</p>
              <p className="text-white/50 text-xs">Permis B réussi, 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
