export default function ComingSoonPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-white">
      <div className="max-w-xl w-full text-center space-y-8">
        {/* Logo / Brand */}
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-[0.3em] text-[#f0a500] uppercase">
            MIA Digital
          </p>
          <h1 className="text-5xl font-bold tracking-tight">Bientôt disponible</h1>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-lg leading-relaxed">
          Notre plateforme de formation est en cours de finalisation.
          Revenez très bientôt pour découvrir nos programmes certifiés.
        </p>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/20 text-xs">●</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Contact */}
        <p className="text-sm text-gray-500">
          Une question ?{' '}
          <a
            href="mailto:contact@miadigital.ma"
            className="text-[#f0a500] hover:underline transition-colors"
          >
            contact@miadigital.ma
          </a>
        </p>
      </div>
    </main>
  )
}
