// app/robots.ts
import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://learngeorgian.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/prototype/', '/api/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
