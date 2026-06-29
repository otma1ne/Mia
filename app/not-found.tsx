'use client'

import Link from 'next/link'
import Image from 'next/image'
import logoSrc from '@/public/logo.png'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Home, BookOpen } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">

      {/* Navbar */}
      <header className="border-b px-6">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm">
            <div className="w-7 h-7 rounded-md bg-white border flex items-center justify-center shrink-0">
              <Image src={logoSrc} alt="MIA Académie" width={20} height={20} className="object-contain" />
            </div>
            MIA Académie
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Accéder à mon espace
          </Link>
        </div>
      </header>

      {/* 404 Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-md">

          {/* Big 404 */}
          <div className="relative mb-8 inline-block">
            <span className="text-[9rem] font-black text-zinc-100 leading-none select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-white border rounded-2xl flex items-center justify-center shadow-lg">
                <Image src={logoSrc} alt="MIA Académie" width={44} height={44} className="object-contain" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Page introuvable
          </h1>
          <p className="mt-3 text-sm text-zinc-500 leading-relaxed">
            La page que vous cherchez n&apos;existe pas ou a été déplacée.
            Revenez à l&apos;accueil ou découvrez nos formations.
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
            >
              <Home className="h-4 w-4" />
              Accueil
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <BookOpen className="h-4 w-4" />
              Nos formations
            </Link>
          </div>

          {/* Back link */}
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à la page précédente
          </button>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-6">
        <div className="mx-auto max-w-6xl flex items-center justify-center">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} MIA Académie · contact@mia-academie.com
          </p>
        </div>
      </footer>

    </div>
  )
}
