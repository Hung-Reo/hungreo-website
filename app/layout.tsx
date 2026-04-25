import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { Toaster } from 'sonner'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { VisitorTracker } from '@/components/VisitorTracker'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { BASE_URL, DEFAULT_METADATA } from '@/lib/metadata'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Minh Tran - Khu Vườn Nhỏ | Portfolio',
    template: '%s | Minh Tran',
  },
  description: '20 năm Unilever — Head of Digital & Technology Consulting, Supply Chain Greater Asia. Khu vườn nhỏ nơi tôi viết những điều thật về hành trình đó.',
  keywords: ['Digital Transformation', 'Supply Chain', 'Operations', 'COO', 'Unilever', 'Business Leader', 'Vietnam', 'Portfolio', 'Minh Tran'],
  authors: [{ name: DEFAULT_METADATA.author }],
  creator: DEFAULT_METADATA.author,
  openGraph: {
    type: 'website',
    locale: DEFAULT_METADATA.locale,
    url: BASE_URL,
    siteName: DEFAULT_METADATA.siteName,
    title: 'Minh Tran - Khu Vườn Nhỏ',
    description: '20 năm Unilever — Head of Digital & Technology Consulting, Supply Chain Greater Asia. Khu vườn nhỏ nơi tôi viết những điều thật về hành trình đó.',
    images: [
      {
        url: `${BASE_URL}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: 'Minh Tran - Digital & Operations Leader',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: DEFAULT_METADATA.twitter,
    title: 'Minh Tran - Khu Vườn Nhỏ',
    description: '20 năm Unilever, Supply Chain Greater Asia. Khu vườn nhỏ — nơi viết thật.',
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
              <VisitorTracker />
            </div>
          </SessionProvider>
        </LanguageProvider>
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  )
}
