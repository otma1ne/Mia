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

export const metadata: Metadata = {
  title: 'MIA Digital',
  description: 'Centre de formation MIA — Programmes certifiés et formateurs experts.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`h-full antialiased ${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
