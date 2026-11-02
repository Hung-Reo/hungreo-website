import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/metadata'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/family/', '/api/family/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
