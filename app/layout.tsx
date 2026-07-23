import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--poppins-font',
})

const BASE_URL = 'https://mia-academie.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'MIA Académie — Centre de formation professionnelle à Paris',
    template: '%s — MIA Académie',
  },
  description:
    'MIA Académie est un organisme de formation professionnelle à Paris. Formations certifiées en développement web, data science, design, marketing digital. Présentiel et en ligne.',
  keywords: [
    'formation professionnelle Paris',
    'centre de formation Paris',
    'formation développement web Paris',
    'formation data science Paris',
    'formation marketing digital Paris',
    'formation en ligne France',
    'MIA Académie',
    'organisme de formation agréé',
  ],
  authors: [{ name: 'MIA Académie', url: BASE_URL }],
  creator: 'MIA Académie',
  publisher: 'MIA Académie',

  // ── OpenGraph ─────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: BASE_URL,
    siteName: 'MIA Académie',
    title: 'MIA Académie — Centre de formation professionnelle à Paris',
    description:
      'Formations certifiées en développement web, data science, design et marketing digital. Présentiel à Paris et en ligne.',
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
    title: 'MIA Académie — Formation professionnelle à Paris',
    description:
      'Formations certifiées en développement web, data science, design et marketing digital à Paris.',
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
      'fr-FR': BASE_URL,
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
    <html lang="fr" className={`h-full antialiased ${poppins.variable}`}>
      <head>
        {/* Géolocalisation — référencement local France / Paris */}
        <meta name="geo.region"   content="FR-75" />
        <meta name="geo.placename" content="Paris, France" />
        <meta name="geo.position" content="48.8566;2.3522" />
        <meta name="ICBM"         content="48.8566, 2.3522" />
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
