import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: ['Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot'],
        allow: '/',
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'Google-Extended', 'CCBot', 'anthropic-ai', 'ClaudeBot', 'Claude-Web', 'Applebot', 'Bytespider', 'PerplexityBot'],
        allow: '/',
      },
    ],
    sitemap: 'https://outlio.io/sitemap.xml',
  }
}
