import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function BilansThankYouPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Success Icon */}
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Merci !</h1>

        {/* Message */}
        <p className="text-lg text-gray-600 mb-8">
          Votre bilan a été soumis avec succès. Un document PDF a été généré et sauvegardé.
        </p>

        {/* Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <p className="text-sm text-gray-600 mb-4">
            Vos réponses nous aident à améliorer continuellement nos formations et à mieux vous accompagner.
          </p>
          <p className="text-xs text-gray-500">
            Un responsable de formation a accès à votre retour pour assurer un meilleur suivi.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1e2128] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
