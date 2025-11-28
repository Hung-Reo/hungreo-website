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
    default: 'Hung Dinh - Business Analyst → AI Product Builder',
    template: '%s | Hung Dinh',
  },
  description: '20 years Business Analyst experience in Education, FMCG & Manufacturing. Building AI-powered products combining analytical rigor with technical execution.',
  keywords: ['Business Analyst', 'AI Product Builder', 'Product Manager', 'AI Products', 'Education Technology', 'FMCG', 'Manufacturing', 'AI Agent', 'RAG', 'Next.js'],
  authors: [{ name: DEFAULT_METADATA.author }],
  creator: DEFAULT_METADATA.author,
  openGraph: {
    type: 'website',
    locale: DEFAULT_METADATA.locale,
    url: BASE_URL,
    siteName: DEFAULT_METADATA.siteName,
    title: 'Hung Dinh - Business Analyst → AI Product Builder',
    description: '20 years Business Analyst experience in Education, FMCG & Manufacturing. Building AI-powered products combining analytical rigor with technical execution.',
    images: [
      {
        url: `${BASE_URL}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: 'Hung Dinh - Business Analyst → AI Product Builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: DEFAULT_METADATA.twitter,
    title: 'Hung Dinh - Business Analyst → AI Product Builder',
    description: '20 years Business Analyst in Education, FMCG & Manufacturing. Now building AI products.',
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
