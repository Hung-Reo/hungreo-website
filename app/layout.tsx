import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { Toaster } from 'sonner'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ChatBot } from '@/components/ChatBot'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { BASE_URL, DEFAULT_METADATA } from '@/lib/metadata'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Hung Reo - Software Engineer & Product Manager',
    template: '%s | Hung Reo',
  },
  description: 'Personal portfolio and blog showcasing software engineering projects, product management insights, and technical articles.',
  keywords: ['Software Engineer', 'Product Manager', 'Portfolio', 'Blog', 'Web Development', 'React', 'Next.js', 'TypeScript'],
  authors: [{ name: DEFAULT_METADATA.author }],
  creator: DEFAULT_METADATA.author,
  openGraph: {
    type: 'website',
    locale: DEFAULT_METADATA.locale,
    url: BASE_URL,
    siteName: DEFAULT_METADATA.siteName,
    title: 'Hung Reo - Software Engineer & Product Manager',
    description: 'Personal portfolio and blog showcasing software engineering projects, product management insights, and technical articles.',
    images: [
      {
        url: `${BASE_URL}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: 'Hung Reo Portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: DEFAULT_METADATA.twitter,
    title: 'Hung Reo - Software Engineer & Product Manager',
    description: 'Personal portfolio and blog showcasing software engineering projects and technical articles.',
    images: [`${BASE_URL}/og-default.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <LanguageProvider>
          <SessionProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <ChatBot />
            </div>
          </SessionProvider>
        </LanguageProvider>
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  )
}
