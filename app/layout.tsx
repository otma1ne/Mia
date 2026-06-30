import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--inter-font',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--grotesk-font',
})

const BASE_URL = 'https://mia-academie.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'MIA Académie — Centre de formation professionnelle à Casablanca',
    template: '%s — MIA Académie',
  },
  description:
    'MIA Académie est un organisme de formation professionnelle à Casablanca. Formations certifiées en développement web, data science, design, marketing digital. Présentiel et en ligne.',
  keywords: [
    'formation professionnelle Casablanca',
    'centre de formation Maroc',
    'formation développement web Maroc',
    'formation data science Maroc',
    'formation marketing digital Casablanca',
    'formation en ligne Maroc',
    'MIA Académie',
    'organisme de formation agréé',
  ],
  authors: [{ name: 'MIA Académie', url: BASE_URL }],
  creator: 'MIA Académie',
  publisher: 'MIA Académie',

  // ── OpenGraph ─────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    locale: 'fr_MA',
    url: BASE_URL,
    siteName: 'MIA Académie',
    title: 'MIA Académie — Centre de formation professionnelle à Casablanca',
    description:
      'Formations certifiées en développement web, data science, design et marketing digital. Présentiel à Casablanca et en ligne.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'MIA Académie — Centre de formation professionnelle',
      },
    ],
  },

  // ── Twitter / X ────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'MIA Académie — Formation professionnelle au Maroc',
    description:
      'Formations certifiées en développement web, data science, design et marketing digital à Casablanca.',
    images: ['/og-image.jpg'],
  },

  // ── Robots ──────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Canonical / alternates ──────────────────────────────────────────
  alternates: {
    canonical: BASE_URL,
    languages: {
      'fr-MA': BASE_URL,
    },
  },

  // ── Vérification moteurs ────────────────────────────────────────────
  // verification: {
  //   google: 'VOTRE_CODE_GOOGLE_SEARCH_CONSOLE',
  //   bing: 'VOTRE_CODE_BING_WEBMASTER',
  // },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`h-full antialiased ${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        {/* Géolocalisation — référencement local Maroc / Casablanca */}
        <meta name="geo.region"   content="MA-06" />
        <meta name="geo.placename" content="Casablanca, Maroc" />
        <meta name="geo.position" content="33.5731;-7.5898" />
        <meta name="ICBM"         content="33.5731, -7.5898" />
        {/* Langue et audience */}
        <meta name="language"  content="fr" />
        <meta name="audience"  content="all" />
        <meta name="revisit-after" content="7 days" />
      </head>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
