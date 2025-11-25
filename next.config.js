/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  // Externalize @sparticuz/chromium to prevent bundling issues
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium'],
  },
}

module.exports = nextConfig
