import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MIA Académie',
    short_name: 'MIA',
    description: 'Centre de formation professionnelle certifié — Programmes certifiés et formateurs experts.',
    start_url: '/',
    display: 'standalone',
    background_color: '#17171C',
    theme_color: '#6B2BD9',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
