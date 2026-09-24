import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BSC Quiz — Buat & mainkan kuis live',
  description:
    'Alternatif Kahoot open source: buat kuis, bagikan PIN, dan mainkan bersama-sama secara realtime. Gratis, jalan di Vercel/Netlify, database Supabase.',
  applicationName: 'BSC Quiz',
  openGraph: {
    title: 'BSC Quiz — Buat & mainkan kuis live',
    description:
      'Buat kuis, bagikan PIN 6 digit, dan lihat skor pemain muncul secara realtime.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return (
    <html lang="id" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        {!configured && <SetupBanner />}
        {children}
      </body>
    </html>
  )
}

function SetupBanner() {
  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="mx-auto max-w-5xl leading-relaxed">
        <strong className="font-bold">Belum terhubung ke database.</strong> Buat
        file <code className="rounded bg-amber-100 px-1">.env.local</code> berisi{' '}
        <code className="rounded bg-amber-100 px-1">
          NEXT_PUBLIC_SUPABASE_URL
        </code>{' '}
        dan{' '}
        <code className="rounded bg-amber-100 px-1">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>{' '}
        dari dashboard Supabase, lalu jalankan{' '}
        <code className="rounded bg-amber-100 px-1">supabase/setup.sql</code>.
        Panduan lengkap ada di README.
      </p>
    </div>
  )
}
