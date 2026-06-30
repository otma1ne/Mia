import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = 'https://mia-academie.com'

  return {
    rules: [
      // ── Moteurs de recherche classiques ─────────────────────────────
      {
        userAgent: ['Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider'],
        allow: ['/'],
        disallow: [
          '/admin/',
          '/student/',
          '/trainer/',
          '/commercial/',
          '/api/',
          '/evaluation/',
          '/signature/',
          '/bilan/',
          '/unauthorized',
        ],
      },
      // ── Crawlers IA — autorisés sur le contenu public ────────────────
      {
        userAgent: [
          'GPTBot',        // OpenAI / ChatGPT
          'ClaudeBot',     // Anthropic / Claude
          'PerplexityBot', // Perplexity
          'YouBot',        // You.com
          'CCBot',         // Common Crawl (entraînement LLMs)
          'anthropic-ai',
          'Meta-ExternalAgent',
          'cohere-ai',
        ],
        allow: ['/', '/formations/', '/courses'],
        disallow: [
          '/admin/',
          '/student/',
          '/trainer/',
          '/commercial/',
          '/api/',
          '/evaluation/',
          '/signature/',
          '/bilan/',
          '/login',
          '/register',
          '/unauthorized',
        ],
      },
      // ── Bots indésirables ────────────────────────────────────────────
      {
        userAgent: ['SemrushBot', 'AhrefsBot', 'MJ12bot', 'DotBot'],
        disallow: ['/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
