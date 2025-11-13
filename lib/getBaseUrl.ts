/**
 * Get base URL for API requests
 * Works in both development and production (Vercel)
 */
export function getBaseUrl(): string {
  // In Vercel production/preview
  if (process.env.VERCEL_URL) {
    const protocol = process.env.VERCEL_ENV === 'production' ? 'https' : 'https'
    return `${protocol}://${process.env.VERCEL_URL}`
  }

  // Fallback to localhost for local development
  return 'http://localhost:3000'
}
